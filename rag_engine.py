"""
rag_engine.py — Per-teacher RAG using Gemini embeddings + ChromaDB

Architecture:
  - Each teacher has exactly ONE ChromaDB collection (named from the DB)
  - Files are chunked, embedded with Gemini, and stored in that collection
  - Queries retrieve top-k chunks then pass them to Gemini for generation
  - Teacher isolation is guaranteed: collection lookup always uses teacherId
"""

import os
import io
import re
import json
import asyncio
import base64
import hashlib
import logging
from typing import Optional

import chromadb
import google.generativeai as genai
from chromadb.config import Settings as ChromaSettings

try:
    from PIL import Image, ImageStat
    from transformers import BlipProcessor, BlipForConditionalGeneration
except Exception:
    Image = None
    ImageStat = None
    BlipProcessor = None
    BlipForConditionalGeneration = None

from config import get_settings
from document_parser import parse_document

logger = logging.getLogger(__name__)

# ─── Chunking constants ───────────────────────────────────────────────────────
CHUNK_SIZE   = 800   # ~600 tokens at ~1.3 chars/token
CHUNK_OVERLAP = 100  # overlap between adjacent chunks


# ─── RAGEngine ────────────────────────────────────────────────────────────────

class RAGEngine:
    """
    Singleton-friendly RAG engine.
    One instance per FastAPI app; thread-safe for reads.
    """

    def __init__(self):
        cfg = get_settings()

        self._gemini_api_key = (cfg.gemini_api_key or "").strip()
        self._gemini_enabled = bool(self._gemini_api_key)
        self._embed_model = "models/gemini-embedding-001"
        self._gen_model = None
        self._vision_model = None

        if self._gemini_enabled:
            # Configure Gemini only when a real key is available.
            genai.configure(api_key=self._gemini_api_key)
            self._gen_model = genai.GenerativeModel("gemini-2.5-flash")
            self._vision_model = genai.GenerativeModel(cfg.vision_model_name)
        else:
            logger.warning(
                "GEMINI_API_KEY is not set; the app will start, but ingest/query features are disabled until it is configured."
            )

        # ChromaDB persistent client
        os.makedirs(cfg.chroma_persist_dir, exist_ok=True)
        self._chroma = chromadb.PersistentClient(
            path=cfg.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )

        self._uploads_root = cfg.uploads_root
        self._image_caption_backend = cfg.image_caption_backend.lower()
        self._blip_model_name = cfg.blip_model_name
        self._pdf_max_pages = cfg.pdf_max_pages
        self._pdf_max_images_per_page = cfg.pdf_max_images_per_page
        self._pdf_min_image_area = cfg.pdf_min_image_area
        self._pdf_vision_concurrency = cfg.pdf_vision_concurrency
        self._blip_processor = None
        self._blip_model = None
        if self._gemini_enabled:
            logger.info("RAGEngine initialised — Gemini + ChromaDB ready")
        else:
            logger.info("RAGEngine initialised — ChromaDB ready, Gemini disabled")
        logger.info(f"Image caption backend: {self._image_caption_backend}")

    def _require_gemini(self, purpose: str) -> None:
        if not self._gemini_enabled or self._gen_model is None or self._vision_model is None:
            raise RuntimeError(
                f"{purpose} requires GEMINI_API_KEY to be set in ai-backend/.env or the environment."
            )

    # ─── Public: Ingest ────────────────────────────────────────────────────────
    async def _describe_with_gemini(self, file_path: str, mime_type: str) -> str:
        """Use Gemini Vision to describe an image, graph, or chart."""
        self._require_gemini("Vision captioning")
        logger.info(f"[vision] describing {mime_type} at {file_path}")
        try:
            with open(file_path, "rb") as f:
                data = f.read()
            
            # Use current gen_model (Gemini Flash) for vision
            prompt = (
                "You are extracting visual knowledge for RAG. "
                "Return a concise summary in under 120 words. "
                "Include: visible text/labels, chart/table type, main trend or relationship, and key values if clearly readable. "
                "Avoid repetition and avoid speculation."
            )
            contents = [
                prompt,
                {"mime_type": mime_type, "data": data}
            ]
            
            # Using asyncio to thread since SDK might be sync
            response = await asyncio.to_thread(self._vision_model.generate_content, contents)
            return response.text.strip()
        except Exception as e:
            logger.error(f"[vision] failed to describe {file_path}: {e}")
            return ""

    async def _describe_video_content(self, file_path: str, mime_type: str) -> str:
        self._require_gemini("Video captioning")
        logger.info(f"[vision] describing video at {file_path}")
        try:
            def _upload_and_describe():
                import time
                import google.generativeai as genai
                video_file = genai.upload_file(path=file_path)
                
                # wait until active
                while video_file.state.name == "PROCESSING":
                    time.sleep(2)
                    video_file = genai.get_file(video_file.name)
                
                if video_file.state.name == "FAILED":
                    raise ValueError("Video processing failed.")

                prompt = (
                    "Act as an expert educational content indexer for a RAG pipeline. Your goal is to convert this video into a highly searchable text representation.\n\n"
                    "1. TRANSCRIPT: Provide a comprehensive, timestamped transcript of all spoken audio. Preserve every technical term and key factual statement.\n"
                    "2. VISUALS: Identify and describe all on-screen text, charts, diagrams, and significant visual demonstrations.\n"
                    "3. KEY TAKEAWAYS: List the primary educational points covered.\n\n"
                    "FORMATTING: Use a dense, keyword-rich style. Remove all conversational filler (um, ah, etc.) and redundant pleasantries to maximize RAG retrieval accuracy and minimize token overhead."
                )
                
                response = self._gen_model.generate_content([prompt, video_file], request_options={"timeout": 600})
                
                # cleanup
                genai.delete_file(video_file.name)
                return response.text.strip()
                
            return await asyncio.to_thread(_upload_and_describe)
        except Exception as e:
            logger.error(f"[vision] failed to describe video {file_path}: {e}")
            return ""

    async def _describe_audio_content(self, file_path: str, mime_type: str) -> str:
        self._require_gemini("Audio transcription")
        logger.info(f"[vision] transcribing audio at {file_path}")
        try:
            def _upload_and_describe():
                import time
                import google.generativeai as genai
                audio_file = genai.upload_file(path=file_path)
                
                # wait until active
                while audio_file.state.name == "PROCESSING":
                    time.sleep(2)
                    audio_file = genai.get_file(audio_file.name)
                
                if audio_file.state.name == "FAILED":
                    raise ValueError("Audio processing failed.")

                prompt = (
                    "Act as an expert educational content indexer for a RAG pipeline. Your goal is to convert this audio into a highly searchable text representation.\n\n"
                    "1. TRANSCRIPT: Provide a comprehensive, timestamped transcript of all spoken audio. Preserve every technical term and key factual statement.\n"
                    "2. KEY TAKEAWAYS: List the primary educational points covered in this session.\n\n"
                    "FORMATTING: Use a dense, keyword-rich style. Remove all conversational filler and redundant pleasantries to maximize RAG retrieval accuracy and minimize token overhead."
                )
                
                response = self._gen_model.generate_content([prompt, audio_file], request_options={"timeout": 600})
                
                # cleanup
                genai.delete_file(audio_file.name)
                return response.text.strip()
                
            return await asyncio.to_thread(_upload_and_describe)
        except Exception as e:
            logger.error(f"[vision] failed to transcribe audio {file_path}: {e}")
            return ""

    def _ensure_blip_loaded(self) -> None:
        """Lazy-load BLIP only when requested to keep startup fast."""
        if self._blip_processor is not None and self._blip_model is not None:
            return

        if not Image or not BlipProcessor or not BlipForConditionalGeneration:
            raise RuntimeError(
                "BLIP dependencies not available. Install transformers, pillow, and torch."
            )

        self._blip_processor = BlipProcessor.from_pretrained(self._blip_model_name)
        self._blip_model = BlipForConditionalGeneration.from_pretrained(self._blip_model_name)

    def _describe_with_blip_sync(self, file_path: str) -> str:
        import torch

        self._ensure_blip_loaded()

        raw_image = Image.open(file_path).convert("RGB")
        # Use image-only captioning for BLIP base model; prompting here can cause
        # instruction echo instead of an actual visual description.
        inputs = self._blip_processor(images=raw_image, return_tensors="pt")

        with torch.no_grad():
            output = self._blip_model.generate(
                **inputs,
                max_new_tokens=160,
                num_beams=5,
                do_sample=False,
            )

        return self._blip_processor.decode(output[0], skip_special_tokens=True).strip()

    async def _describe_with_blip(self, file_path: str) -> str:
        logger.info(f"[blip] generating image caption for {file_path}")
        try:
            return await asyncio.to_thread(self._describe_with_blip_sync, file_path)
        except Exception as e:
            logger.error(f"[blip] failed to describe {file_path}: {e}")
            return ""

    async def _describe_visual_content(self, file_path: str, mime_type: str) -> str:
        """Describe visual content using configured backend with fallback."""
        if self._image_caption_backend == "blip":
            description = await self._describe_with_blip(file_path)
            if description:
                return description

            logger.warning("[blip] caption empty, falling back to Gemini Vision")

        self._require_gemini("Vision fallback")
        return await self._describe_with_gemini(file_path, mime_type)

    async def _extract_pdf_image_unit(
        self,
        *,
        file_name: str,
        page_num: int,
        image_index: int,
        image_bytes: bytes,
        image_ext: str,
        vision_cache: dict[str, str],
        semaphore: asyncio.Semaphore,
    ) -> Optional[dict]:
        """Describe one PDF image and return a classified unit."""
        import tempfile

        image_hash = hashlib.sha1(image_bytes).hexdigest()
        cached = vision_cache.get(image_hash)
        if cached:
            description = cached
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
                    description = await self._describe_visual_content(img_path, mime)

                if description:
                    vision_cache[image_hash] = description
            finally:
                try:
                    if os.path.exists(img_path):
                        os.remove(img_path)
                except Exception:
                    pass

        if not description:
            return None

        return {
            "kind": "pdf_image",
            "page": page_num,
            "image_index": image_index,
            "content": (
                f"[Source: {file_name} (PDF)]\n"
                f"[Classification: Image | Page {page_num} | Image {image_index}]\n"
                f"{description}"
            ),
        }

    def _is_meaningful_image_bytes(self, image_bytes: bytes) -> bool:
        """Filter out likely masks/blank assets that are common in PDFs."""
        if not Image or not ImageStat:
            return True

        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("L")
            width, height = img.size
            if width * height < self._pdf_min_image_area:
                return False

            extrema = img.getextrema()
            dynamic_range = float(extrema[1] - extrema[0])
            stddev = float(ImageStat.Stat(img).stddev[0])

            # Near-flat images are typically separators, masks, or blank regions.
            if dynamic_range < 16 or stddev < 8:
                return False
            return True
        except Exception:
            return True

    async def _extract_pdf_units(self, file_path: str, file_name: str) -> list[dict]:
        """Classify PDF content into text and image units for independent chunking."""
        import fitz

        units: list[dict] = []
        doc = fitz.open(file_path)
        total_pages = min(len(doc), self._pdf_max_pages)
        vision_cache: dict[str, str] = {}
        seen_image_hashes: set[str] = set()
        image_tasks = []
        semaphore = asyncio.Semaphore(max(1, self._pdf_vision_concurrency))

        try:
            for page_idx in range(total_pages):
                page = doc[page_idx]
                page_num = page_idx + 1

                page_text = (page.get_text("text") or "").strip()
                page_height = max(1.0, float(page.rect.height))

                # Extract text blocks with Y positions for intra-page chunk targeting
                text_blocks_pos: list[tuple[float, str]] = []
                for blk in (page.get_text("blocks") or []):
                    # blocks format: (x0, y0, x1, y1, text, block_no, type)
                    if len(blk) >= 7 and int(blk[6]) == 0:  # type 0 = text block
                        blk_text = (blk[4] or "").strip()
                        if blk_text:
                            y_norm = round(float(blk[1]) / page_height, 4)
                            text_blocks_pos.append((y_norm, blk_text[:200]))

                if page_text:
                    units.append({
                        "kind": "pdf_text",
                        "page": page_num,
                        "text_blocks_pos": text_blocks_pos,
                        "content": (
                            f"[Source: {file_name} (PDF)]\n"
                            f"[Classification: Text | Page {page_num}]\n"
                            f"{page_text}"
                        ),
                    })

                page_dict = page.get_text("dict")
                blocks = page_dict.get("blocks") or []
                candidates = []
                for image_idx, block in enumerate(blocks, start=1):
                    if block.get("type") != 1:
                        continue

                    image_bytes = block.get("image")
                    if not image_bytes:
                        continue

                    bbox = block.get("bbox") or [0, 0, 0, 0]
                    displayed_w = max(0.0, float(bbox[2]) - float(bbox[0]))
                    displayed_h = max(0.0, float(bbox[3]) - float(bbox[1]))
                    displayed_area = displayed_w * displayed_h

                    width = int(block.get("width") or 0)
                    height = int(block.get("height") or 0)
                    pixel_area = width * height

                    if max(displayed_area, pixel_area) < self._pdf_min_image_area:
                        continue
                    if not self._is_meaningful_image_bytes(image_bytes):
                        continue

                    image_hash = hashlib.sha1(image_bytes).hexdigest()
                    if image_hash in seen_image_hashes:
                        continue
                    seen_image_hashes.add(image_hash)

                    image_ext = (block.get("ext") or "png").lower()
                    candidates.append((image_idx, image_bytes, image_ext, max(displayed_area, pixel_area)))

                # Prioritize large visuals (charts/diagrams), skip tiny icons.
                candidates.sort(key=lambda x: x[3], reverse=True)
                candidates = candidates[: max(0, self._pdf_max_images_per_page)]

                for image_idx, image_bytes, image_ext, _ in candidates:
                    try:
                        image_tasks.append(
                            self._extract_pdf_image_unit(
                                file_name=file_name,
                                page_num=page_num,
                                image_index=image_idx,
                                image_bytes=image_bytes,
                                image_ext=image_ext,
                                vision_cache=vision_cache,
                                semaphore=semaphore,
                            )
                        )
                    except Exception as e:
                        logger.warning(
                            "[ingest] Failed to process PDF image block on page %s (image %s): %s",
                            page_num,
                            image_idx,
                            e,
                        )

            if image_tasks:
                described_units = await asyncio.gather(*image_tasks, return_exceptions=True)
                for item in described_units:
                    if isinstance(item, Exception):
                        logger.warning("[ingest] PDF image description task failed: %s", item)
                        continue
                    if item:
                        units.append(item)
        finally:
            doc.close()

        return units

    async def ingest_file(
        self,
        *,
        teacher_id: str,
        collection_name: str,
        file_id: str,
        file_path: str,
        file_name: str,
        is_assignment: bool = False,
    ) -> dict:
        """
        Parse the document, including visual descriptions for images/graphs, chunk it,
        and index in ChromaDB.
        """
        logger.info(f"[ingest] teacher={teacher_id} file={file_name}")

        ext = os.path.splitext(file_path)[1].lower()
        units: list[dict] = []

        # 1. Handle Images directly
        if ext in ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tif', '.tiff'):
            mime = f"image/{ext[1:] if ext != '.jpg' else 'jpeg'}"
            visual_desc = await self._describe_visual_content(file_path, mime)
            units.append({
                "kind": "image",
                "page": None,
                "content": (
                    f"[Source: {file_name} (Image)]\n"
                    "[Classification: Image]\n"
                    f"{visual_desc}"
                ),
            })
        elif ext in ('.mp4', '.mov', '.avi', '.mkv', '.webm'):
            if ext == '.mov': mime = "video/quicktime"
            elif ext == '.avi': mime = "video/x-msvideo"
            elif ext == '.mkv': mime = "video/x-matroska"
            else: mime = f"video/{ext[1:]}"
            
            visual_desc = await self._describe_video_content(file_path, mime)
            units.append({
                "kind": "video",
                "page": None,
                "content": (
                    f"[Source: {file_name} (Video)]\n"
                    "[Classification: Video]\n"
                    f"{visual_desc}"
                ),
            })
        elif ext in ('.mp3', '.wav', '.aac', '.m4a'):
            if ext == '.mp3': mime = "audio/mpeg"
            elif ext == '.m4a': mime = "audio/x-m4a"
            else: mime = f"audio/{ext[1:]}"
            
            audio_desc = await self._describe_audio_content(file_path, mime)
            units.append({
                "kind": "audio",
                "page": None,
                "content": (
                    f"[Source: {file_name} (Audio)]\n"
                    "[Classification: Audio]\n"
                    f"{audio_desc}"
                ),
            })
        elif ext == '.pdf':
            units = await self._extract_pdf_units(file_path, file_name)
        else:
            # 2. Parse standard document
            text = parse_document(file_path)
            units.append({
                "kind": "document_text",
                "page": None,
                "content": f"[Source: {file_name}]\n[Classification: Text]\n{text}",
            })

        units = [u for u in units if (u.get("content") or "").strip()]
        if not units:
            raise ValueError(f"No extractable content (text or visual) in {file_name}")

        # 2. Chunk classified units independently
        chunk_records: list[tuple[str, dict]] = []
        for unit in units:
            if unit.get("kind") in ("image", "pdf_image"):
                # Keep one chunk per visual unit for predictable counts and source mapping.
                chunk_records.append((unit["content"], unit))
            elif unit.get("kind") == "video":
                # Video descriptions might be long, so chunk them as normal text
                unit_chunks = self._chunk_text(unit["content"], min_len=50)
                for chunk in unit_chunks:
                    chunk_records.append((chunk, unit))
            else:
                unit_chunks = self._chunk_text(unit["content"], min_len=50)
                for chunk in unit_chunks:
                    chunk_records.append((chunk, unit))

        if not chunk_records:
            raise ValueError(f"No chunkable content generated for {file_name}")

        logger.info(f"[ingest] %s chunks from '%s'", len(chunk_records), file_name)

        # 3. Get/create collection (teacher-isolated)
        col = self._chroma.get_or_create_collection(
            name=collection_name,
            metadata={"teacher_id": teacher_id, "hnsw:space": "cosine"},
        )

        # 4. Embed & upsert in batches of 100 (Gemini API limit)
        batch_size = 100
        ids, docs, metas = [], [], []

        for i, (chunk, unit) in enumerate(chunk_records):
            chunk_id = f"{file_id}_chunk_{i}"
            # Deduplicate by chunk_id (upsert handles re-ingestion)
            ids.append(chunk_id)
            docs.append(chunk)
            metas.append({
                "file_id": file_id,
                "file_name": file_name,
                "teacher_id": teacher_id,
                "is_assignment": str(is_assignment).lower(),
                "content_type": unit.get("kind", "text"),
                "chunk_idx": i,
                "page": int(unit.get("page") or -1),
                "image_index": int(unit.get("image_index") or -1),
                "y_offset": self._find_y_offset(chunk, unit),
                "snippet": chunk[:200],
            })

        for start in range(0, len(ids), batch_size):
            batch_docs = docs[start : start + batch_size]
            batch_metas = metas[start : start + batch_size]
            batch_ids   = ids[start : start + batch_size]

            # Offload blocking Gemini embed call to thread pool
            embeddings = await self._embed_batch(batch_docs)

            col.upsert(
                ids=batch_ids,
                documents=batch_docs,
                metadatas=batch_metas,
                embeddings=embeddings,
            )

        logger.info(f"[ingest] {len(chunk_records)} chunks upserted for file {file_id}")
        return {"chunks_added": len(chunk_records), "file_id": file_id}

    # ─── Public: Delete ────────────────────────────────────────────────────────

    def delete_file_chunks(
        self,
        *,
        collection_name: str,
        file_id: str,
    ) -> dict:
        """Remove all chunks for a deleted file from the teacher's collection."""
        try:
            col = self._chroma.get_collection(collection_name)
            col.delete(where={"file_id": file_id})
            logger.info(f"[delete] chunks removed for file {file_id}")
            return {"deleted": True}
        except Exception as e:
            logger.warning(f"[delete] collection {collection_name} not found or empty: {e}")
            return {"deleted": False}

    # ─── Public: Query ─────────────────────────────────────────────────────────

    async def query(
        self,
        *,
        teacher_id: str,
        collection_name: str,
        question: str,
        image_base64: Optional[str] = None,
        top_k: int = 6,
        chat_history: Optional[list[dict]] = None,
    ) -> dict:
        """
        Retrieve relevant chunks from the teacher's collection and
        generate an answer using Gemini.

        Returns {'answer': str, 'sources': list[dict]}
        """
        self._require_gemini("Question answering")
        scope_pattern = r"^\[Context:\s*Only answer from the file with id\s+([a-f0-9-]+)\]\s*"
        scope_match = re.match(scope_pattern, question, flags=re.IGNORECASE)
        scoped_file_id = scope_match.group(1) if scope_match else None
        effective_question = re.sub(scope_pattern, "", question, count=1, flags=re.IGNORECASE).strip()
        if not effective_question:
            effective_question = question

        logger.info(
            f"[query] teacher={teacher_id} scoped_file_id={scoped_file_id} q='{effective_question[:60]}...'"
        )

        # 1. Get collection
        try:
            col = self._chroma.get_collection(collection_name)
        except Exception:
            return {
                "answer": "Your knowledge base is empty. Please upload some files first.",
                "sources": [],
            }

        # 2. Embed the question (offloaded to thread pool — non-blocking)
        q_embedding = (await self._embed_batch([effective_question], task_type="retrieval_query"))[0]

        # 3. Retrieve top-k chunks
        query_kwargs = {
            "query_embeddings": [q_embedding],
            "n_results": min(top_k, col.count()),
            "include": ["documents", "metadatas", "distances"],
        }
        if scoped_file_id:
            query_kwargs["where"] = {"file_id": scoped_file_id}

        results = col.query(**query_kwargs)

        chunks    = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0]

        if not chunks:
            if scoped_file_id:
                return {
                    "answer": (
                        "I cannot answer your question as no context from the file "
                        f"with ID {scoped_file_id} was provided in the knowledge base."
                    ),
                    "sources": [],
                }
            return {
                "answer": "I couldn't find relevant information in your knowledge base for this question.",
                "sources": [],
            }

        retrieved_chunks = []
        for i, (chunk, meta, dist) in enumerate(zip(chunks, metadatas, distances), start=1):
            chunk_idx = int(meta.get("chunk_idx", -1))
            retrieved_chunks.append({
                "source_index": i,
                "chunk": chunk,
                "distance": float(dist),
                "file_id": meta.get("file_id", ""),
                "file_name": meta.get("file_name", "unknown"),
                "chunk_idx": chunk_idx,
                "page": int(meta.get("page", -1)),
                "image_index": int(meta.get("image_index", -1)),
                "content_type": meta.get("content_type", "unknown"),
                "y_offset": float(meta.get("y_offset", 0.0)),
            })

        # 4. Build context string
        context_parts = []
        is_assignment_mode = False
        for item in retrieved_chunks:
            meta = metadatas[item["source_index"] - 1]
            if str(meta.get("is_assignment", "")).lower() == "true":
                is_assignment_mode = True
            context_parts.append(
                f"[Source {item['source_index']}: {item['file_name']} | chunk {item['chunk_idx']}]\n{item['chunk']}"
            )
        context = "\n\n---\n\n".join(context_parts)

        assignment_protocol = ""
        if is_assignment_mode:
            assignment_protocol = """
## ASSIGNMENT PROTOCOL (STRICT ENFORCEMENT)
The knowledge base context includes materials marked as **ASSIGNMENTS**. For these specific materials:
- **STRICTLY PROHIBITED**: Do NOT provide the final answer, solution, or completed work.
- **MANDATORY**: Only provide **HINTS**, guidance, and conceptual explanations.
- **STRATEGY**: Guide the student step-by-step. Ask probing questions like "What do you think the next step after X would be?" or "Have you considered how Y affects Z?".
- **TONE**: Be a supportive coach. Start by saying: "Since this is related to an assignment, I'll guide you with hints and concepts to help you solve it yourself!"
"""

        # 5. Build prompt
        history_text = ""
        if chat_history:
            for msg in chat_history[-6:]:  # Last 3 turns
                role  = "Student" if msg.get("role") == "user" else "Assistant"
                history_text += f"{role}: {msg.get('content', '')}\n"

        # 5. Build multimodal prompt parts
        system_prompt = f"""You are an elite Professor's AI Teaching Assistant powered by a multimodal RAG system. Your sole mission is to provide brilliant, structured, and deeply insightful answers grounded **strictly** in the knowledge base context provided.

## RESPONSE RULES

### Structure (MANDATORY)
- Always use **Markdown formatting**: headers (##, ###), bullet points, numbered lists, bold, and code blocks where appropriate.
- Begin complex answers with a brief **TL;DR** summary in 1-2 sentences, then elaborate.
- End answers about dense topics with a **Key Takeaways** section using bullet points.
- If you cite a source, use the format: *[Source: filename.pdf, chunk N]*

### Multimodal Analysis (CRITICAL)
- If a **visual snippet (image)** is provided, it takes HIGHEST PRIORITY. Describe what the figure shows:
  - Its title/label (if visible)
  - Axis labels, legends, or table headers
  - Key trends, peaks, anomalies, or relationships
  - How it connects to the surrounding text context
  - What a student should learn from it
- Never say "I can see an image" — instead, directly analyze and explain its academic content.

### Reasoning Quality
- Be specific and use exact terminology from the documents.
- If information is NOT in the context, say: "This specific detail isn't in the provided materials, but based on context..."
- Do NOT invent facts or hallucinate content not grounded in the knowledge base.
- Explain concepts at a university level — thorough, accurate, and pedagogically clear.

- For complex topics, break them down step-by-step.
{assignment_protocol}
---

Recent Conversation History:
{history_text}

---

Knowledge Base Context (Curriculum Materials):
{context}

Return STRICT JSON only with this schema:
{{
    "answer": "string",
    "citations": [
        {{ "source": 1, "quote": "exact quote copied from that source chunk" }}
    ]
}}

Rules:
- `source` must be the numeric source index shown above.
- `quote` must be copied verbatim from that source chunk text.
- Include 1-4 citations only for evidence actually used in the answer.
- Do not wrap JSON in markdown.
"""
        prompt_parts = [system_prompt]
        
        # Add visual content if provided
        if image_base64:
            try:
                # Clean prefix if exists (data:image/png;base64,...)
                header = "base64,"
                if header in image_base64:
                    image_base64 = image_base64.split(header)[1]

                image_bytes = base64.b64decode(image_base64)
                
                prompt_parts.append({
                    "mime_type": "image/png", 
                    "data": image_bytes
                })
                prompt_parts.append("\n[Note: The student has selected the visual area provided in the image above for analysis.]")
            except Exception as e:
                logger.error(f"Image processing error: {e}")

        prompt_parts.append(f"Student Question: {effective_question}")

        # 6. Generate answer (offloaded to thread pool — non-blocking)
        response = await asyncio.to_thread(self._gen_model.generate_content, prompt_parts)
        raw_response = (response.text or "").strip()

        def _extract_json_payload(text: str) -> Optional[dict]:
            if not text:
                return None

            cleaned = text.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r"\s*```$", "", cleaned)

            try:
                payload = json.loads(cleaned)
                return payload if isinstance(payload, dict) else None
            except Exception:
                pass

            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start < 0 or end <= start:
                return None

            try:
                payload = json.loads(cleaned[start:end + 1])
                return payload if isinstance(payload, dict) else None
            except Exception:
                return None

        payload = _extract_json_payload(raw_response)
        answer = raw_response
        model_citations = []

        if payload:
            parsed_answer = payload.get("answer")
            if isinstance(parsed_answer, str) and parsed_answer.strip():
                answer = parsed_answer.strip()

            parsed_citations = payload.get("citations")
            if isinstance(parsed_citations, list):
                model_citations = parsed_citations

        citation_lookup = {}
        for citation in model_citations:
            if not isinstance(citation, dict):
                continue

            quote = str(citation.get("quote") or "").strip()
            if not quote:
                continue

            source_number = citation.get("source")
            source_idx = None
            if isinstance(source_number, int):
                source_idx = source_number
            elif isinstance(source_number, str) and source_number.strip().isdigit():
                source_idx = int(source_number.strip())

            if source_idx is None or source_idx < 1 or source_idx > len(retrieved_chunks):
                continue

            src = retrieved_chunks[source_idx - 1]
            ref_key = (src["file_id"], src["chunk_idx"])
            existing_quote = citation_lookup.get(ref_key)
            if existing_quote is None or len(quote) > len(existing_quote):
                citation_lookup[ref_key] = quote

        # 7. Build source list with chunk-level references for frontend citations.
        question_terms = set(re.findall(r"[a-z0-9]{4,}", effective_question.lower()))

        def _build_relevant_snippet(chunk_text: str) -> str:
            lines = [ln.strip() for ln in chunk_text.splitlines() if ln.strip()]
            # Remove synthetic ingest headers that are useful for metadata but noisy for viewer highlighting.
            lines = [ln for ln in lines if not re.match(r"^\[(Source|Classification):", ln, flags=re.IGNORECASE)]
            clean = re.sub(r"\s+", " ", " ".join(lines)).strip()
            if not clean:
                return ""

            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+", clean) if s.strip()]
            if not sentences:
                return clean[:280]

            best_idx = 0
            best_score = -1
            for idx, sentence in enumerate(sentences):
                sent_terms = set(re.findall(r"[a-z0-9]{4,}", sentence.lower()))
                overlap = len(sent_terms & question_terms)
                score = overlap * 3 + min(len(sentence), 200) / 200
                if score > best_score:
                    best_score = score
                    best_idx = idx

            if best_score <= 0:
                return clean[:280]

            snippet = sentences[best_idx]
            if len(snippet) < 140 and best_idx + 1 < len(sentences):
                snippet = f"{snippet} {sentences[best_idx + 1]}"

            return snippet[:280]

        def _find_quote_span(chunk_text: str, quote: str) -> tuple[Optional[int], Optional[int], Optional[str]]:
            if not quote:
                return None, None, None

            candidate = quote.strip().strip('"').strip("'")
            if not candidate:
                return None, None, None

            pos = chunk_text.find(candidate)
            if pos >= 0:
                end = pos + len(candidate)
                return pos, end, chunk_text[pos:end]

            lower_chunk = chunk_text.lower()
            lower_candidate = candidate.lower()
            pos = lower_chunk.find(lower_candidate)
            if pos >= 0:
                end = pos + len(candidate)
                return pos, end, chunk_text[pos:end]

            return None, None, None

        seen_refs = set()
        sources = []
        for item in retrieved_chunks:
            chunk = item["chunk"]
            fid = item["file_id"]
            chunk_idx = item["chunk_idx"]
            ref_key = (fid, chunk_idx)
            if ref_key in seen_refs:
                continue

            seen_refs.add(ref_key)

            page_val = item["page"]
            # Fallback: extract page from embedded chunk header for old data that lacks page metadata
            # Every chunk starts with "[Classification: Text | Page N]" so this always works
            if page_val < 0 and chunk:
                _pm = re.search(r'\[Classification:[^\]]*\bPage\s+(\d+)\b', chunk, re.IGNORECASE)
                if _pm:
                    page_val = int(_pm.group(1))
            image_idx_val = item["image_index"]
            snippet = _build_relevant_snippet(chunk)

            highlight_text = None
            highlight_start = None
            highlight_end = None

            citation_quote = citation_lookup.get(ref_key)
            if citation_quote:
                start, end, exact_text = _find_quote_span(chunk, citation_quote)
                if exact_text:
                    highlight_text = exact_text
                    highlight_start = start
                    highlight_end = end
                    snippet = exact_text
                else:
                    highlight_text = citation_quote

            sources.append({
                "file_id": fid,
                "file_name": item["file_name"],
                "relevance": round(1 - item["distance"], 3),
                "chunk_idx": chunk_idx if chunk_idx >= 0 else None,
                "page": page_val if page_val >= 0 else None,
                "image_index": image_idx_val if image_idx_val >= 0 else None,
                "content_type": item["content_type"],
                "snippet": snippet,
                "highlight_text": highlight_text,
                "highlight_start": highlight_start,
                "highlight_end": highlight_end,
                "y_offset": item["y_offset"],
            })

        return {"answer": answer, "sources": sources}

    # ─── Private helpers ───────────────────────────────────────────────────────

    def _find_y_offset(self, chunk: str, unit: dict) -> float:
        """
        Estimate the normalized Y position (0.0–1.0) of a chunk within its PDF page.
        Uses word-overlap matching between the chunk's opening words and the
        pre-extracted text block positions stored in the unit.
        """
        blocks: list[tuple[float, str]] = unit.get("text_blocks_pos", [])
        if not blocks:
            return 0.0

        # Use first 200 chars of the chunk (skip synthetic headers)
        chunk_head = re.sub(r"^\[(Source|Classification):[^\]]+\]\s*", "", chunk[:200], flags=re.IGNORECASE)
        chunk_words = set(re.findall(r"[a-z0-9']{3,}", chunk_head.lower()))
        if not chunk_words:
            return 0.0

        best_y = 0.0
        best_score = 0
        for y_norm, blk_text in blocks:
            blk_words = set(re.findall(r"[a-z0-9']{3,}", blk_text.lower()))
            score = len(chunk_words & blk_words)
            if score > best_score:
                best_score = score
                best_y = y_norm

        return round(best_y, 4) if best_score >= 2 else 0.0

    def _chunk_text(self, text: str, min_len: int = 50) -> list[str]:
        """Split text into overlapping chunks with a minimum size threshold."""
        text = re.sub(r'\n{3,}', '\n\n', text)  # Normalise whitespace
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + CHUNK_SIZE, len(text))
            chunk = text[start:end].strip()
            # Skip tiny trailing chunks — they waste embed API calls and pollute results
            if chunk and len(chunk) >= min_len:
                chunks.append(chunk)
            start += CHUNK_SIZE - CHUNK_OVERLAP
        if not chunks and text.strip():
            # Keep short documents/images queryable instead of dropping them.
            chunks.append(text.strip())
        return chunks

    async def _embed_batch(self, texts: list[str], task_type: str = "retrieval_document") -> list[list[float]]:
        """Embed a list of texts using Gemini gemini-embedding-001.

        Runs the synchronous Gemini SDK call in a thread-pool executor so it
        never blocks the FastAPI event loop.
        """
        self._require_gemini("Document embedding")
        result = await asyncio.to_thread(
            genai.embed_content,
            model=self._embed_model,
            content=texts,
            task_type=task_type,
        )
        return result["embedding"]


# ─── Module-level singleton ────────────────────────────────────────────────────
_engine: Optional[RAGEngine] = None

def get_engine() -> RAGEngine:
    global _engine
    if _engine is None:
        _engine = RAGEngine()
    return _engine
