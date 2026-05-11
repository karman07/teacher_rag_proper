"""
rag_engine.py — Per-teacher RAG using GPU cluster (Llama 3.3 + Qdrant)
"""
import os, re, io, json, asyncio, base64, hashlib, logging, tempfile
from typing import Optional
from config import get_settings
from document_parser import parse_document
from gpu_client import GPUClient

logger = logging.getLogger(__name__)
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
VISION_PROMPT = (
    "You are extracting visual knowledge for RAG. "
    "Return a concise summary in under 120 words. "
    "Include: visible text/labels, chart/table type, main trend or relationship, and key values if clearly readable. "
    "Avoid repetition and avoid speculation."
)


class RAGEngine:
    def __init__(self):
        cfg = get_settings()
        self.gpu = GPUClient(cfg.gpu_gateway_url, cfg.llm_model_name, cfg.vision_model_name)
        self._uploads_root = cfg.uploads_root
        self._pdf_max_pages = cfg.pdf_max_pages
        self._pdf_max_images_per_page = cfg.pdf_max_images_per_page
        self._pdf_min_image_area = cfg.pdf_min_image_area
        self._pdf_vision_concurrency = cfg.pdf_vision_concurrency
        logger.info("RAGEngine initialised — GPU cluster mode")

    # ── Chunking ──────────────────────────────────────────────────────────

    def _chunk_text(self, text: str, min_len: int = 50) -> list[str]:
        text = re.sub(r'\n{3,}', '\n\n', text)
        chunks, start = [], 0
        while start < len(text):
            end = min(start + CHUNK_SIZE, len(text))
            chunk = text[start:end].strip()
            if chunk and len(chunk) >= min_len:
                chunks.append(chunk)
            start += CHUNK_SIZE - CHUNK_OVERLAP
        if not chunks and text.strip():
            chunks.append(text.strip())
        return chunks

    def _find_y_offset(self, chunk: str, unit: dict) -> float:
        blocks = unit.get("text_blocks_pos", [])
        if not blocks:
            return 0.0
        chunk_head = re.sub(r"^\[(Source|Classification):[^\]]+\]\s*", "", chunk[:200], flags=re.IGNORECASE)
        chunk_words = set(re.findall(r"[a-z0-9']{3,}", chunk_head.lower()))
        if not chunk_words:
            return 0.0
        best_y, best_score = 0.0, 0
        for y_norm, blk_text in blocks:
            blk_words = set(re.findall(r"[a-z0-9']{3,}", blk_text.lower()))
            score = len(chunk_words & blk_words)
            if score > best_score:
                best_score = score
                best_y = y_norm
        return round(best_y, 4) if best_score >= 2 else 0.0

    # ── Vision helpers ────────────────────────────────────────────────────

    async def _describe_image_file(self, file_path: str, mime_type: str) -> str:
        logger.info(f"[vision] describing {mime_type} at {file_path}")
        try:
            with open(file_path, "rb") as f:
                data = f.read()
            return await self.gpu.describe_image(data, mime_type, VISION_PROMPT)
        except Exception as e:
            logger.error(f"[vision] failed: {e}")
            return ""

    async def _transcribe_audio(self, file_path: str) -> str:
        logger.info(f"[whisper] transcribing {file_path}")
        try:
            from faster_whisper import WhisperModel
            def _run():
                model = WhisperModel("base", compute_type="int8", device="cpu")
                segments, _ = model.transcribe(file_path, beam_size=5)
                lines = []
                for seg in segments:
                    m, s = divmod(int(seg.start), 60)
                    h, m = divmod(m, 60)
                    lines.append(f"[{h:02d}:{m:02d}:{s:02d}] {seg.text.strip()}")
                return "\n".join(lines)
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"[whisper] failed: {e}")
            return ""

    def _is_meaningful_image(self, image_bytes: bytes) -> bool:
        try:
            from PIL import Image, ImageStat
            img = Image.open(io.BytesIO(image_bytes)).convert("L")
            if img.size[0] * img.size[1] < self._pdf_min_image_area:
                return False
            extrema = img.getextrema()
            if float(extrema[1] - extrema[0]) < 16 or float(ImageStat.Stat(img).stddev[0]) < 8:
                return False
            return True
        except Exception:
            return True

    # ── PDF extraction ────────────────────────────────────────────────────

    async def _extract_pdf_image_unit(self, *, file_name, page_num, image_index, image_bytes, image_ext, vision_cache, semaphore):
        image_hash = hashlib.sha1(image_bytes).hexdigest()
        if image_hash in vision_cache:
            description = vision_cache[image_hash]
        else:
            suffix = f".{image_ext}" if image_ext else ".png"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(image_bytes)
                img_path = tmp.name
            try:
                mime = f"image/{image_ext}" if image_ext else "image/png"
                if image_ext == "jpg":
                    mime = "image/jpeg"
                async with semaphore:
                    description = await self._describe_image_file(img_path, mime)
                if description:
                    vision_cache[image_hash] = description
            finally:
                try:
                    os.remove(img_path)
                except Exception:
                    pass
        if not description:
            return None
        return {
            "kind": "pdf_image", "page": page_num, "image_index": image_index,
            "content": f"[Source: {file_name} (PDF)]\n[Classification: Image | Page {page_num} | Image {image_index}]\n{description}",
        }

    async def _extract_pdf_units(self, file_path: str, file_name: str) -> list[dict]:
        import fitz
        units, doc = [], fitz.open(file_path)
        total_pages = min(len(doc), self._pdf_max_pages)
        vision_cache, seen_hashes, image_tasks = {}, set(), []
        semaphore = asyncio.Semaphore(max(1, self._pdf_vision_concurrency))
        try:
            for page_idx in range(total_pages):
                page = doc[page_idx]
                page_num = page_idx + 1
                page_text = (page.get_text("text") or "").strip()
                page_height = max(1.0, float(page.rect.height))
                text_blocks_pos = []
                for blk in (page.get_text("blocks") or []):
                    if len(blk) >= 7 and int(blk[6]) == 0:
                        blk_text = (blk[4] or "").strip()
                        if blk_text:
                            text_blocks_pos.append((round(float(blk[1]) / page_height, 4), blk_text[:200]))
                if page_text:
                    units.append({"kind": "pdf_text", "page": page_num, "text_blocks_pos": text_blocks_pos,
                                  "content": f"[Source: {file_name} (PDF)]\n[Classification: Text | Page {page_num}]\n{page_text}"})
                page_dict = page.get_text("dict")
                candidates = []
                for img_idx, block in enumerate(page_dict.get("blocks", []), start=1):
                    if block.get("type") != 1:
                        continue
                    image_bytes = block.get("image")
                    if not image_bytes:
                        continue
                    bbox = block.get("bbox") or [0,0,0,0]
                    area = max((bbox[2]-bbox[0])*(bbox[3]-bbox[1]), int(block.get("width",0))*int(block.get("height",0)))
                    if area < self._pdf_min_image_area or not self._is_meaningful_image(image_bytes):
                        continue
                    ih = hashlib.sha1(image_bytes).hexdigest()
                    if ih in seen_hashes:
                        continue
                    seen_hashes.add(ih)
                    candidates.append((img_idx, image_bytes, (block.get("ext") or "png").lower(), area))
                candidates.sort(key=lambda x: x[3], reverse=True)
                for img_idx, ib, ie, _ in candidates[:self._pdf_max_images_per_page]:
                    image_tasks.append(self._extract_pdf_image_unit(
                        file_name=file_name, page_num=page_num, image_index=img_idx,
                        image_bytes=ib, image_ext=ie, vision_cache=vision_cache, semaphore=semaphore))
            if image_tasks:
                for item in await asyncio.gather(*image_tasks, return_exceptions=True):
                    if isinstance(item, Exception):
                        logger.warning(f"[ingest] PDF image task failed: {item}")
                    elif item:
                        units.append(item)
        finally:
            doc.close()
        return units

    # ── Ingest ────────────────────────────────────────────────────────────

    async def ingest_file(self, *, teacher_id, collection_name, file_id, file_path, file_name, is_assignment=False) -> dict:
        logger.info(f"[ingest] teacher={teacher_id} file={file_name}")
        ext = os.path.splitext(file_path)[1].lower()
        units: list[dict] = []

        if ext in ('.png','.jpg','.jpeg','.webp','.gif','.bmp','.tif','.tiff'):
            mime = f"image/{ext[1:]}" if ext != '.jpg' else "image/jpeg"
            desc = await self._describe_image_file(file_path, mime)
            units.append({"kind":"image","page":None,"content":f"[Source: {file_name} (Image)]\n[Classification: Image]\n{desc}"})
        elif ext in ('.mp4','.mov','.avi','.mkv','.webm'):
            desc = await self._transcribe_audio(file_path)
            units.append({"kind":"video","page":None,"content":f"[Source: {file_name} (Video)]\n[Classification: Video]\n{desc}"})
        elif ext in ('.mp3','.wav','.aac','.m4a'):
            desc = await self._transcribe_audio(file_path)
            units.append({"kind":"audio","page":None,"content":f"[Source: {file_name} (Audio)]\n[Classification: Audio]\n{desc}"})
        elif ext == '.pdf':
            units = await self._extract_pdf_units(file_path, file_name)
        elif ext == '.youtube':
            with open(file_path, "r") as f:
                url = f.read().strip()
            try:
                yt_desc = await asyncio.to_thread(self._get_yt_transcript, url, file_name)
            except Exception as e:
                logger.warning(f"[youtube] API failed: {e}. Falling back to audio download...")
                yt_desc = await self._youtube_audio_fallback(url, file_name)
            units.append({"kind":"youtube","page":None,"content":yt_desc})
        else:
            text = parse_document(file_path)
            units.append({"kind":"document_text","page":None,"content":f"[Source: {file_name}]\n[Classification: Text]\n{text}"})

        units = [u for u in units if (u.get("content") or "").strip()]
        if not units:
            raise ValueError(f"No extractable content in {file_name}")

        chunk_records = []
        for unit in units:
            if unit.get("kind") in ("image", "pdf_image"):
                chunk_records.append((unit["content"], unit))
            else:
                for chunk in self._chunk_text(unit["content"], min_len=50):
                    chunk_records.append((chunk, unit))
        if not chunk_records:
            raise ValueError(f"No chunkable content for {file_name}")

        logger.info(f"[ingest] {len(chunk_records)} chunks from '{file_name}'")
        await self.gpu.qdrant_ensure_collection(collection_name, vector_size=1024)

        # Embed and upsert in batches
        batch_size = 32
        for start in range(0, len(chunk_records), batch_size):
            batch = chunk_records[start:start+batch_size]
            texts = [c[0] for c in batch]
            embeddings = await self.gpu.embed(texts)
            points = []
            for j, ((chunk, unit), vector) in enumerate(zip(batch, embeddings)):
                idx = start + j
                points.append({
                    "id": hashlib.md5(f"{file_id}_chunk_{idx}".encode()).hexdigest()[:32],
                    "vector": vector,
                    "payload": {
                        "file_id": file_id, "file_name": file_name, "teacher_id": teacher_id,
                        "is_assignment": str(is_assignment).lower(),
                        "content_type": unit.get("kind", "text"), "chunk_idx": idx,
                        "page": int(unit.get("page") or -1),
                        "image_index": int(unit.get("image_index") or -1),
                        "y_offset": self._find_y_offset(chunk, unit),
                        "document": chunk, "snippet": chunk[:200],
                    },
                })
            await self.gpu.qdrant_upsert(collection_name, points)

        logger.info(f"[ingest] {len(chunk_records)} chunks upserted for file {file_id}")
        return {"chunks_added": len(chunk_records), "file_id": file_id}

    def _get_yt_transcript(self, url, file_name):
        from youtube_transcript_api._api import YouTubeTranscriptApi
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(url)
        video_id = None
        if parsed.hostname == 'youtu.be':
            video_id = parsed.path[1:]
        elif parsed.hostname in ('www.youtube.com','youtube.com'):
            if parsed.path == '/watch':
                video_id = parse_qs(parsed.query).get('v',[None])[0]
            elif parsed.path.startswith(('/embed/','/v/')):
                video_id = parsed.path.split('/')[2]
        if not video_id:
            raise ValueError(f"Could not extract video ID from {url}")
        tl = YouTubeTranscriptApi.list_transcripts(video_id)
        try:
            t = tl.find_transcript(['en'])
        except Exception:
            t = list(tl)[0]
            if t.is_translatable:
                try: t = t.translate('en')
                except Exception: pass
        transcript = t.fetch()
        content = f"[Source: {file_name} (YouTube Video)]\n[Classification: YouTube Transcript]\n"
        for chunk in transcript:
            m, s = divmod(chunk['start'], 60)
            h, m = divmod(m, 60)
            content += f"[{int(h):02d}:{int(m):02d}:{int(s):02d}] {chunk['text']}\n"
        return content

    async def _youtube_audio_fallback(self, url, file_name):
        import httpx
        try:
            async with httpx.AsyncClient(timeout=300) as client:
                res = await client.post(
                    f"{self.gpu._gateway.rstrip('/')}/transcribe", 
                    json={"url": url}
                )
                res.raise_for_status()
                data = res.json()
                if data.get("success"):
                    desc = data.get("text", "")
                    return f"[Source: {file_name} (YouTube Video)]\n[Classification: YouTube Transcript (Whisper)]\n{desc}"
                else:
                    logger.warning(f"[youtube] Gateway whisper failed: {data}")
                    return ""
        except Exception as e:
            logger.error(f"[youtube] Gateway whisper error: {e}")
            return ""

    # ── Delete ────────────────────────────────────────────────────────────

    async def delete_file_chunks(self, *, collection_name, file_id) -> dict:
        try:
            await self.gpu.qdrant_delete(collection_name, {
                "must": [{"key": "file_id", "match": {"value": file_id}}]
            })
            logger.info(f"[delete] chunks removed for file {file_id}")
            return {"deleted": True}
        except Exception as e:
            logger.warning(f"[delete] failed: {e}")
            return {"deleted": False}

    # ── Query ─────────────────────────────────────────────────────────────

    async def query(self, *, teacher_id, collection_name, question, image_base64=None, top_k=8, chat_history=None) -> dict:
        scope_pattern = r"^\[Context:\s*Only answer from the file with id\s+([a-f0-9-]+)\]\s*"
        scope_match = re.match(scope_pattern, question, flags=re.IGNORECASE)
        scoped_file_id = scope_match.group(1) if scope_match else None
        effective_question = re.sub(scope_pattern, "", question, count=1, flags=re.IGNORECASE).strip() or question

        logger.info(f"[query] teacher={teacher_id} scoped={scoped_file_id} q='{effective_question[:60]}...'")

        # 1. Embed question
        q_embedding = (await self.gpu.embed([effective_question]))[0]

        # 2. Retrieve top-20 from Qdrant
        qdrant_filter = None
        if scoped_file_id:
            qdrant_filter = {"must": [{"key": "file_id", "match": {"value": scoped_file_id}}]}
        try:
            results = await self.gpu.qdrant_search(collection_name, q_embedding, limit=20, filter_=qdrant_filter)
        except Exception as e:
            logger.error(f"[query] Qdrant search error: {e}", exc_info=True)
            return {"answer": "Your knowledge base is empty. Please upload some files first.", "sources": []}

        if not results:
            msg = f"No context from file {scoped_file_id}." if scoped_file_id else "No relevant information found."
            return {"answer": msg, "sources": []}

        # 3. Rerank
        docs_for_rerank = [r["payload"]["document"] for r in results]
        try:
            reranked = await self.gpu.rerank(effective_question, docs_for_rerank, top_n=top_k)
            top_indices = [r["index"] for r in reranked]
        except Exception as e:
            logger.warning(f"[rerank] failed, using raw order: {e}")
            top_indices = list(range(min(top_k, len(results))))

        retrieved_chunks = []
        for rank, idx in enumerate(top_indices, start=1):
            r = results[idx]
            p = r["payload"]
            retrieved_chunks.append({
                "source_index": rank, "chunk": p["document"], "distance": 1 - r["score"],
                "file_id": p.get("file_id",""), "file_name": p.get("file_name","unknown"),
                "chunk_idx": int(p.get("chunk_idx",-1)), "page": int(p.get("page",-1)),
                "image_index": int(p.get("image_index",-1)), "content_type": p.get("content_type","unknown"),
                "y_offset": float(p.get("y_offset",0.0)),
            })

        # 4. Build context
        context_parts, is_assignment = [], False
        for item in retrieved_chunks:
            if item.get("is_assignment","") == "true":
                is_assignment = True
            context_parts.append(f"[Source {item['source_index']}: {item['file_name']} | chunk {item['chunk_idx']}]\n{item['chunk']}")
        context = "\n\n---\n\n".join(context_parts)

        assignment_protocol = ""
        if is_assignment:
            assignment_protocol = (
                "\n## ASSIGNMENT PROTOCOL\n"
                "Materials marked as ASSIGNMENTS: provide HINTS only, NOT solutions.\n"
                "Guide step-by-step. Ask probing questions.\n"
            )

        history_text = ""
        if chat_history:
            for msg in chat_history[-6:]:
                role = "Student" if msg.get("role") == "user" else "Assistant"
                history_text += f"{role}: {msg.get('content','')}\n"

        system_prompt = f"""You are an elite Professor's AI Teaching Assistant. Your goal is to provide deep, insightful, and comprehensive explanations based STICTLY on the provided Knowledge Base.

## RESPONSE GUIDELINES
- Be Professorial: Use academic but accessible language. Provide context and "why" behind facts.
- Structure: Use Markdown (headers, bold, lists) to make the answer highly readable.
- Detail: If the context allows, provide a thorough explanation. Do not be terse.
- Citing: When mentioning a fact, cite it inline like (Source 1).
- **Formulas: Use standard LaTeX delimiters. Use $...$ for inline math and $$...$$ for block math.**

## ASSIGNMENT PROTOCOL
{assignment_protocol}

## CITATIONS BLOCK
At the very end of your response, you MUST include a "CITATIONS" block in this EXACT JSON format:
<CITATIONS>
{{"citations": [{{"source": 1, "quote": "verbatim text"}}]}}
</CITATIONS>
Rules: 
- 'source' is the numeric CHUNK index.
- 'quote' must be the EXACT verbatim text from that chunk.
- Include 1-6 high-quality citations.

Conversation History:
{history_text}

Knowledge Base Context:
{context}
"""
        # 5. Generate
        messages = [{"role": "system", "content": system_prompt}]
        if image_base64:
            header = "base64,"
            if header in (image_base64 or ""):
                image_base64 = image_base64.split(header)[1]
            messages.append({"role": "user", "content": [
                {"type": "text", "text": f"[Visual snippet provided for analysis]\nStudent Question: {effective_question}"},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}},
            ]})
            # Use vision model for image queries
            raw = await self.gpu.describe_image(
                base64.b64decode(image_base64), "image/png",
                f"{system_prompt}\n\nStudent Question: {effective_question}"
            )
        else:
            messages.append({"role": "user", "content": f"Student Question: {effective_question}"})
            raw = await self.gpu.generate(messages, temperature=0.3)

        # 6. Parse response and citations
        answer = raw
        model_citations = []
        
        if "<CITATIONS>" in raw and "</CITATIONS>" in raw:
            parts = raw.split("<CITATIONS>")
            answer = parts[0].strip()
            citation_json = parts[1].split("</CITATIONS>")[0].strip()
            payload = self._extract_json(citation_json)
            if payload and isinstance(payload.get("citations"), list):
                model_citations = payload["citations"]

        # 7. Build sources
        citation_lookup = {}
        for c in model_citations:
            if not isinstance(c, dict): continue
            quote = str(c.get("quote","")).strip()
            if not quote: continue
            sn = c.get("source")
            si = int(sn) if isinstance(sn, int) else (int(sn) if isinstance(sn, str) and sn.strip().isdigit() else None)
            if si is None or si < 1 or si > len(retrieved_chunks): continue
            src = retrieved_chunks[si-1]
            rk = (src["file_id"], src["chunk_idx"])
            if rk not in citation_lookup or len(quote) > len(citation_lookup[rk]):
                citation_lookup[rk] = quote

        question_terms = set(re.findall(r"[a-z0-9]{4,}", effective_question.lower()))
        seen, sources = set(), []
        for item in retrieved_chunks:
            rk = (item["file_id"], item["chunk_idx"])
            if rk in seen: continue
            seen.add(rk)
            chunk = item["chunk"]
            page_val = item["page"]
            if page_val < 0 and chunk:
                pm = re.search(r'\[Classification:[^\]]*\bPage\s+(\d+)\b', chunk, re.IGNORECASE)
                if pm: page_val = int(pm.group(1))
            snippet = self._build_snippet(chunk, question_terms)
            ht, hs, he = None, None, None
            cq = citation_lookup.get(rk)
            if cq:
                s, e, et = self._find_quote_span(chunk, cq)
                if et: ht, hs, he, snippet = et, s, e, et
                else: ht = cq
            sources.append({
                "file_id": item["file_id"], "file_name": item["file_name"],
                "relevance": round(1 - item["distance"], 3),
                "chunk_idx": item["chunk_idx"] if item["chunk_idx"] >= 0 else None,
                "page": page_val if page_val >= 0 else None,
                "image_index": item["image_index"] if item["image_index"] >= 0 else None,
                "content_type": item["content_type"], "snippet": snippet,
                "highlight_text": ht, "highlight_start": hs, "highlight_end": he,
                "y_offset": item["y_offset"],
            })
        return {"answer": answer, "sources": sources}

    async def stream_query(self, *, teacher_id, collection_name, question, image_base64=None, top_k=8, chat_history=None):
        import time
        t_start = time.time()
        logger.info(f"[stream] START teacher={teacher_id} q={question[:40]}...")
        
        # 0. Send padding to burst buffers (4KB is usually enough for all proxies/browsers)
        yield " " * 4096 
        logger.info(f"[stream] [{time.time()-t_start:.2f}s] padding sent")

        # 1. Scope detection
        scope_pattern = r"^\[Context:\s*Only answer from the file with id\s+([a-f0-9-]+)\]\s*"
        scope_match = re.match(scope_pattern, question, flags=re.IGNORECASE)
        scoped_file_id = scope_match.group(1) if scope_match else None
        effective_question = re.sub(scope_pattern, "", question, flags=re.IGNORECASE).strip()

        # 2. Retrieve chunks
        q_embedding = (await self.gpu.embed([effective_question]))[0]
        logger.info(f"[stream] [{time.time()-t_start:.2f}s] embedded")
        
        qdrant_filter = None
        if scoped_file_id:
            qdrant_filter = {"must": [{"key": "file_id", "match": {"value": scoped_file_id}}]}
        
        results = await self.gpu.qdrant_search(collection_name, q_embedding, limit=20, filter_=qdrant_filter)
        logger.info(f"[stream] [{time.time()-t_start:.2f}s] qdrant search done ({len(results)} res)")
        
        if not results:
            yield "I couldn't find any relevant information in the knowledge base to answer your question."
            return

        docs_for_rerank = [r["payload"]["document"] for r in results]
        reranked = await self.gpu.rerank(effective_question, docs_for_rerank, top_n=top_k)
        logger.info(f"[stream] [{time.time()-t_start:.2f}s] rerank done")
        
        retrieved_chunks = []
        for r in reranked:
            idx = r["index"]
            p = results[idx]["payload"]
            retrieved_chunks.append({
                "chunk": p["document"], "distance": 1 - results[idx]["score"],
                "file_id": p.get("file_id",""), "file_name": p.get("file_name","unknown"),
                "chunk_idx": int(p.get("chunk_idx",-1)), "page": int(p.get("page",-1)),
                "image_index": int(p.get("image_index",-1)), "content_type": p.get("content_type","unknown"),
                "y_offset": float(p.get("y_offset",0.0)),
                "score": r["score"]
            })

        # 3. Build prompt (same as query)
        context_parts = []
        for i, res in enumerate(retrieved_chunks, 1):
            context_parts.append(f"[Source {i}: {res['file_name']} | chunk {res['chunk_idx']}]\n{res['chunk']}")
        context = "\n\n---\n\n".join(context_parts)

        assignment_protocol = ""
        if any(c.get("is_assignment") for c in retrieved_chunks):
            assignment_protocol = (
                "\n## ASSIGNMENT PROTOCOL\n"
                "Materials marked as ASSIGNMENTS: provide HINTS only, NOT solutions.\n"
                "Guide step-by-step. Ask probing questions.\n"
            )

        history_text = ""
        if chat_history:
            for msg in chat_history[-6:]:
                role = "Student" if msg.get("role") == "user" else "Assistant"
                history_text += f"{role}: {msg.get('content','')}\n"

        system_prompt = f"""You are an elite Professor's AI Teaching Assistant. Your goal is to provide deep, insightful, and comprehensive explanations based STICTLY on the provided Knowledge Base.

## RESPONSE GUIDELINES
- Be Professorial: Use academic but accessible language. Provide context and "why" behind facts.
- Structure: Use Markdown (headers, bold, lists) to make the answer highly readable.
- Detail: If the context allows, provide a thorough explanation. Do not be terse.
- Citing: When mentioning a fact, cite it inline like (Source 1).
- **Formulas: Use standard LaTeX delimiters. Use $...$ for inline math and $$...$$ for block math.**

## ASSIGNMENT PROTOCOL
{assignment_protocol}

## CITATIONS BLOCK
At the very end of your response, you MUST include a "CITATIONS" block in this EXACT JSON format:
<CITATIONS>
{{"citations": [{{"source": 1, "quote": "verbatim text"}}]}}
</CITATIONS>
Rules: 
- 'source' is the numeric CHUNK index.
- 'quote' must be the EXACT verbatim text from that chunk.
- Include 1-6 high-quality citations.

Conversation History:
{history_text}

Knowledge Base Context:
{context}
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Student Question: {effective_question}"}
        ]

        # 4. Stream Tokens
        full_text = ""
        async for chunk in self.gpu.stream_generate(messages, temperature=0.3):
            full_text += chunk
            yield chunk

        # 5. Extract Citations from full_text at the end
        model_citations = []
        if "<CITATIONS>" in full_text and "</CITATIONS>" in full_text:
            try:
                citation_json = full_text.split("<CITATIONS>")[1].split("</CITATIONS>")[0].strip()
                payload = self._extract_json(citation_json)
                if payload and isinstance(payload.get("citations"), list):
                    model_citations = payload["citations"]
            except Exception: pass
        
        # 6. Build Sources
        citation_lookup = {}
        for c in model_citations:
            if not isinstance(c, dict): continue
            quote = str(c.get("quote","")).strip()
            if not quote: continue
            sn = c.get("source")
            si = int(sn) if isinstance(sn, int) else (int(sn) if isinstance(sn, str) and sn.strip().isdigit() else None)
            if si is None or si < 1 or si > len(retrieved_chunks): continue
            src = retrieved_chunks[si-1]
            rk = (src["file_id"], src["chunk_idx"])
            if rk not in citation_lookup or len(quote) > len(citation_lookup[rk]):
                citation_lookup[rk] = quote

        question_terms = set(re.findall(r"[a-z0-9]{4,}", effective_question.lower()))
        seen, sources = set(), []
        for item in retrieved_chunks:
            rk = (item["file_id"], item["chunk_idx"])
            if rk in seen: continue
            seen.add(rk)
            chunk = item["chunk"]
            page_val = item["page"]
            if page_val < 0 and chunk:
                pm = re.search(r'\[Classification:[^\]]*\bPage\s+(\d+)\b', chunk, re.IGNORECASE)
                if pm: page_val = int(pm.group(1))
            snippet = self._build_snippet(chunk, question_terms)
            ht, hs, he = None, None, None
            cq = citation_lookup.get(rk)
            if cq:
                s, e, et = self._find_quote_span(chunk, cq)
                if et: ht, hs, he, snippet = et, s, e, et
                else: ht = cq
            sources.append({
                "file_id": item["file_id"], "file_name": item["file_name"],
                "relevance": round(1 - item["distance"], 3),
                "chunk_idx": item["chunk_idx"] if item["chunk_idx"] >= 0 else None,
                "page": page_val if page_val >= 0 else None,
                "image_index": item["image_index"] if item["image_index"] >= 0 else None,
                "content_type": item["content_type"], "snippet": snippet,
                "highlight_text": ht, "highlight_start": hs, "highlight_end": he,
                "y_offset": item["y_offset"],
            })
        
        yield f"\n[METADATA]{json.dumps({'sources': sources})}"


    # ── Response parsing helpers ──────────────────────────────────────────

    def _extract_json(self, text):
        if not text: return None
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        try:
            p = json.loads(cleaned)
            return p if isinstance(p, dict) else None
        except Exception: pass
        s, e = cleaned.find("{"), cleaned.rfind("}")
        if s < 0 or e <= s: return None
        try:
            p = json.loads(cleaned[s:e+1])
            return p if isinstance(p, dict) else None
        except Exception: return None

    def _build_snippet(self, chunk, question_terms):
        lines = [ln.strip() for ln in chunk.splitlines() if ln.strip()]
        lines = [ln for ln in lines if not re.match(r"^\[(Source|Classification):", ln, re.IGNORECASE)]
        clean = re.sub(r"\s+", " ", " ".join(lines)).strip()
        if not clean: return ""
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+", clean) if s.strip()]
        if not sentences: return clean[:280]
        best_idx, best_score = 0, -1
        for i, s in enumerate(sentences):
            st = set(re.findall(r"[a-z0-9]{4,}", s.lower()))
            score = len(st & question_terms) * 3 + min(len(s), 200) / 200
            if score > best_score: best_score, best_idx = score, i
        if best_score <= 0: return clean[:280]
        snip = sentences[best_idx]
        if len(snip) < 140 and best_idx + 1 < len(sentences):
            snip = f"{snip} {sentences[best_idx+1]}"
        return snip[:280]

    def _find_quote_span(self, chunk, quote):
        if not quote: return None, None, None
        c = quote.strip().strip('"').strip("'")
        if not c: return None, None, None
        pos = chunk.find(c)
        if pos >= 0: return pos, pos+len(c), chunk[pos:pos+len(c)]
        pos = chunk.lower().find(c.lower())
        if pos >= 0: return pos, pos+len(c), chunk[pos:pos+len(c)]
        return None, None, None


_engine: Optional[RAGEngine] = None

def get_engine() -> RAGEngine:
    global _engine
    if _engine is None:
        _engine = RAGEngine()
    return _engine
