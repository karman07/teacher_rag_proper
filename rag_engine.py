"""
rag_engine.py — Per-teacher RAG using Gemini embeddings + ChromaDB

Architecture:
  - Each teacher has exactly ONE ChromaDB collection (named from the DB)
  - Files are chunked, embedded with Gemini, and stored in that collection
  - Queries retrieve top-k chunks then pass them to Gemini for generation
  - Teacher isolation is guaranteed: collection lookup always uses teacherId
"""

import os
import re
import asyncio
import hashlib
import logging
from typing import Optional

import chromadb
import google.generativeai as genai
from chromadb.config import Settings as ChromaSettings

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

        # Configure Gemini
        genai.configure(api_key=cfg.gemini_api_key)
        self._embed_model = "models/gemini-embedding-001"
        self._gen_model   = genai.GenerativeModel("gemini-2.5-flash")

        # ChromaDB persistent client
        os.makedirs(cfg.chroma_persist_dir, exist_ok=True)
        self._chroma = chromadb.PersistentClient(
            path=cfg.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )

        self._uploads_root = cfg.uploads_root
        logger.info("RAGEngine initialised — Gemini + ChromaDB ready")

    # ─── Public: Ingest ────────────────────────────────────────────────────────

    async def ingest_file(
        self,
        *,
        teacher_id: str,
        collection_name: str,
        file_id: str,
        file_path: str,
        file_name: str,
    ) -> dict:
        """
        Parse the document at `file_path`, chunk it, embed with Gemini,
        and upsert into the teacher's private ChromaDB collection.

        Returns {'chunks_added': int, 'file_id': str}
        """
        logger.info(f"[ingest] teacher={teacher_id} file={file_name}")

        # 1. Parse to text
        text = parse_document(file_path)
        if not text.strip():
            raise ValueError(f"No extractable text in {file_name}")

        # 2. Chunk
        chunks = self._chunk_text(text)
        logger.info(f"[ingest] {len(chunks)} chunks from '{file_name}'")

        # 3. Get/create collection (teacher-isolated)
        col = self._chroma.get_or_create_collection(
            name=collection_name,
            metadata={"teacher_id": teacher_id, "hnsw:space": "cosine"},
        )

        # 4. Embed & upsert in batches of 100 (Gemini API limit)
        batch_size = 100
        ids, docs, metas = [], [], []

        for i, chunk in enumerate(chunks):
            chunk_id = f"{file_id}_chunk_{i}"
            # Deduplicate by chunk_id (upsert handles re-ingestion)
            ids.append(chunk_id)
            docs.append(chunk)
            metas.append({
                "file_id":   file_id,
                "file_name": file_name,
                "chunk_idx": i,
                "teacher_id": teacher_id,
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

        logger.info(f"[ingest] {len(chunks)} chunks upserted for file {file_id}")
        return {"chunks_added": len(chunks), "file_id": file_id}

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
        top_k: int = 6,
        chat_history: Optional[list[dict]] = None,
    ) -> dict:
        """
        Retrieve relevant chunks from the teacher's collection and
        generate an answer using Gemini.

        Returns {'answer': str, 'sources': list[dict]}
        """
        logger.info(f"[query] teacher={teacher_id} q='{question[:60]}...'")

        # 1. Get collection
        try:
            col = self._chroma.get_collection(collection_name)
        except Exception:
            return {
                "answer": "Your knowledge base is empty. Please upload some files first.",
                "sources": [],
            }

        # 2. Embed the question (offloaded to thread pool — non-blocking)
        q_embedding = (await self._embed_batch([question], task_type="retrieval_query"))[0]

        # 3. Retrieve top-k chunks
        results = col.query(
            query_embeddings=[q_embedding],
            n_results=min(top_k, col.count()),
            include=["documents", "metadatas", "distances"],
        )

        chunks    = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0]

        if not chunks:
            return {
                "answer": "I couldn't find relevant information in your knowledge base for this question.",
                "sources": [],
            }

        # 4. Build context string
        context_parts = []
        for i, (chunk, meta) in enumerate(zip(chunks, metadatas)):
            context_parts.append(
                f"[Source {i+1}: {meta.get('file_name', 'unknown')} | chunk {meta.get('chunk_idx', '?')}]\n{chunk}"
            )
        context = "\n\n---\n\n".join(context_parts)

        # 5. Build prompt
        history_text = ""
        if chat_history:
            for msg in chat_history[-6:]:  # Last 3 turns
                role  = "Student" if msg.get("role") == "user" else "Assistant"
                history_text += f"{role}: {msg.get('content', '')}\n"

        system_prompt = f"""You are an intelligent teaching assistant. You have access to the teacher's personal knowledge base.
Answer the student's question based ONLY on the provided context. If the answer is not in the context, say so clearly.
Be concise, educational, and cite the source document name when relevant.

{f'Recent conversation:{chr(10)}{history_text}' if history_text else ''}

Knowledge Base Context:
{context}

Student Question: {question}

Answer:"""

        # 6. Generate answer (offloaded to thread pool — non-blocking)
        response = await asyncio.to_thread(self._gen_model.generate_content, system_prompt)
        answer = response.text.strip()

        # 7. Build source list (deduplicated by file)
        seen_files = set()
        sources = []
        for meta, dist in zip(metadatas, distances):
            fid = meta.get("file_id", "")
            if fid not in seen_files:
                seen_files.add(fid)
                sources.append({
                    "file_id":    fid,
                    "file_name":  meta.get("file_name", "unknown"),
                    "relevance":  round(1 - float(dist), 3),
                })

        return {"answer": answer, "sources": sources}

    # ─── Private helpers ───────────────────────────────────────────────────────

    def _chunk_text(self, text: str) -> list[str]:
        """Split text into overlapping chunks with a minimum size threshold."""
        text = re.sub(r'\n{3,}', '\n\n', text)  # Normalise whitespace
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + CHUNK_SIZE, len(text))
            chunk = text[start:end].strip()
            # Skip tiny trailing chunks — they waste embed API calls and pollute results
            if chunk and len(chunk) > 50:
                chunks.append(chunk)
            start += CHUNK_SIZE - CHUNK_OVERLAP
        return chunks

    async def _embed_batch(self, texts: list[str], task_type: str = "retrieval_document") -> list[list[float]]:
        """Embed a list of texts using Gemini gemini-embedding-001.

        Runs the synchronous Gemini SDK call in a thread-pool executor so it
        never blocks the FastAPI event loop.
        """
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
