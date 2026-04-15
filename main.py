"""
main.py — FastAPI RAG Service
Endpoints:
  POST /ingest          — Ingest a file into a teacher's collection
  POST /query           — Query a teacher's knowledge base
  DELETE /files/{id}    — Remove file chunks from a collection
  GET  /health          — Health check
  GET  /collections     — List ChromaDB collections (admin)
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from rag_engine import get_engine
from config import get_settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
logger = logging.getLogger("rag.api")


# ─── Startup / Shutdown ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting RAG service — warming up engine…")
    get_engine()  # pre-warm the singleton
    logger.info("RAG engine ready ✓")
    yield
    logger.info("RAG service shutting down")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="TeachAI RAG Service",
    description="Per-teacher RAG pipeline using Gemini + ChromaDB",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    teacher_id:      str = Field(..., description="UUID of the teacher")
    collection_name: str = Field(..., description="ChromaDB collection name (from DB)")
    file_id:         str = Field(..., description="UUID of the KnowledgeFile record")
    file_path:       str = Field(..., description="Absolute path to the file on disk")
    file_name:       str = Field(..., description="Original filename for display")


class IngestResponse(BaseModel):
    success:      bool
    chunks_added: int
    file_id:      str
    message:      str


class QueryMessage(BaseModel):
    role:    str  # "user" | "assistant"
    content: str


class QueryRequest(BaseModel):
    teacher_id:      str
    collection_name: str
    question:        str = Field(..., min_length=3)
    top_k:           int = Field(default=6, ge=1, le=20)
    chat_history:    Optional[list[QueryMessage]] = None


class SourceDoc(BaseModel):
    file_id:   str
    file_name: str
    relevance: float


class QueryResponse(BaseModel):
    answer:  str
    sources: list[SourceDoc]


class DeleteRequest(BaseModel):
    collection_name: str
    file_id:         str


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "TeachAI RAG", "version": "1.0.0"}


@app.post("/ingest", response_model=IngestResponse)
async def ingest_file(req: IngestRequest):
    """
    Parse and embed a teacher's file into their private ChromaDB collection.
    This is called by the NestJS backend after a successful file upload.
    """
    try:
        engine = get_engine()
        result = await engine.ingest_file(
            teacher_id=req.teacher_id,
            collection_name=req.collection_name,
            file_id=req.file_id,
            file_path=req.file_path,
            file_name=req.file_name,
        )
        return IngestResponse(
            success=True,
            chunks_added=result["chunks_added"],
            file_id=result["file_id"],
            message=f"Successfully ingested {result['chunks_added']} chunks from '{req.file_name}'",
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Ingest error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@app.post("/query", response_model=QueryResponse)
async def query_knowledge_base(req: QueryRequest):
    """
    Query a teacher's knowledge base with a natural language question.
    Returns an AI-generated answer grounded in the teacher's documents.
    """
    try:
        engine = get_engine()
        history = (
            [{"role": m.role, "content": m.content} for m in req.chat_history]
            if req.chat_history else None
        )
        result = await engine.query(
            teacher_id=req.teacher_id,
            collection_name=req.collection_name,
            question=req.question,
            top_k=req.top_k,
            chat_history=history,
        )
        return QueryResponse(
            answer=result["answer"],
            sources=[SourceDoc(**s) for s in result["sources"]],
        )
    except Exception as e:
        logger.error(f"Query error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@app.delete("/files/{file_id}")
async def delete_file_chunks(file_id: str, req: DeleteRequest):
    """
    Remove all chunks for a given file from the teacher's ChromaDB collection.
    Called when a teacher deletes a file from their knowledge base.
    """
    try:
        engine = get_engine()
        result = engine.delete_file_chunks(
            collection_name=req.collection_name,
            file_id=req.file_id,
        )
        return {"success": True, "deleted": result["deleted"], "file_id": file_id}
    except Exception as e:
        logger.error(f"Delete error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/collections")
async def list_collections(x_admin_key: str = Header(default=None)):
    """Admin endpoint to list all ChromaDB collections (teachers)."""
    cfg = get_settings()
    expected = getattr(cfg, 'admin_secret', None)
    if not expected or x_admin_key != expected:
        raise HTTPException(status_code=403, detail="Forbidden: valid X-Admin-Key header required")
    from rag_engine import get_engine
    engine = get_engine()
    cols = engine._chroma.list_collections()
    return {
        "collections": [
            {"name": c.name, "count": c.count(), "metadata": c.metadata}
            for c in cols
        ]
    }
