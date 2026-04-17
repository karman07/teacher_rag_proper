#!/usr/bin/env python3
"""Quick end-to-end PDF ingest test for the RAG pipeline.

Usage:
  ./venv/bin/python test_pdf_ingest.py --pdf r.pdf
  ./venv/bin/python test_pdf_ingest.py --pdf r.pdf --max-pages 3 --max-images-per-page 2 --min-image-area 90000 --vision-concurrency 6
"""

import argparse
import asyncio
import time
import uuid
from pathlib import Path

import fitz

from config import get_settings
from rag_engine import get_engine


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run PDF ingest speed/quality sanity check")
    parser.add_argument("--pdf", default="r.pdf", help="Path to the PDF file")
    parser.add_argument("--question", default="Summarize the PDF and include key visual insights.", help="Question for retrieval sanity check")
    parser.add_argument("--top-k", type=int, default=8, help="Top-k retrieval chunks")
    parser.add_argument("--max-pages", type=int, default=None, help="Override PDF_MAX_PAGES for this run")
    parser.add_argument("--max-images-per-page", type=int, default=None, help="Override PDF_MAX_IMAGES_PER_PAGE for this run")
    parser.add_argument("--min-image-area", type=int, default=None, help="Override PDF_MIN_IMAGE_AREA for this run")
    parser.add_argument("--vision-concurrency", type=int, default=None, help="Override PDF_VISION_CONCURRENCY for this run")
    return parser


async def run_test(args: argparse.Namespace) -> int:
    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"ERROR=PDF not found: {pdf_path}")
        return 1

    page_count = fitz.open(str(pdf_path)).page_count
    cfg = get_settings()
    engine = get_engine()

    if args.max_pages is not None:
        engine._pdf_max_pages = args.max_pages
    if args.max_images_per_page is not None:
        engine._pdf_max_images_per_page = args.max_images_per_page
    if args.min_image_area is not None:
        engine._pdf_min_image_area = args.min_image_area
    if args.vision_concurrency is not None:
        engine._pdf_vision_concurrency = args.vision_concurrency

    teacher_id = f"teacher_{uuid.uuid4().hex[:8]}"
    collection_name = f"pdf_test_{uuid.uuid4().hex[:8]}"
    file_id = f"file_{uuid.uuid4().hex[:8]}"

    print(f"PDF_PATH={pdf_path.resolve()}")
    print(f"PDF_TOTAL_PAGES={page_count}")
    print(f"IMAGE_CAPTION_BACKEND={cfg.image_caption_backend}")
    print(f"VISION_MODEL={getattr(cfg, 'vision_model_name', 'N/A')}")
    print(f"RUN_MAX_PAGES={engine._pdf_max_pages}")
    print(f"RUN_MAX_IMAGES_PER_PAGE={engine._pdf_max_images_per_page}")
    print(f"RUN_MIN_IMAGE_AREA={engine._pdf_min_image_area}")
    print(f"RUN_VISION_CONCURRENCY={engine._pdf_vision_concurrency}")

    t0 = time.perf_counter()
    ingest_result = await engine.ingest_file(
        teacher_id=teacher_id,
        collection_name=collection_name,
        file_id=file_id,
        file_path=str(pdf_path.resolve()),
        file_name=pdf_path.name,
    )
    elapsed = time.perf_counter() - t0

    col = engine._chroma.get_collection(collection_name)
    fetched = col.get(where={"file_id": file_id}, include=["documents", "metadatas"])
    docs = fetched.get("documents") or []
    metas = fetched.get("metadatas") or []

    type_counts = {}
    unique_pdf_images = set()
    for meta in metas:
        content_type = (meta or {}).get("content_type", "unknown")
        type_counts[content_type] = type_counts.get(content_type, 0) + 1
        if content_type == "pdf_image":
            page = int((meta or {}).get("page", -1))
            image_idx = int((meta or {}).get("image_index", -1))
            unique_pdf_images.add((page, image_idx))

    print("INGEST_STATUS=SUCCESS")
    print(f"ELAPSED_SECONDS={elapsed:.2f}")
    print(f"CHUNKS_ADDED={ingest_result.get('chunks_added')}")
    print(f"TOTAL_STORED_CHUNKS={len(docs)}")
    print(f"CONTENT_TYPE_COUNTS={type_counts}")
    print(f"UNIQUE_PDF_IMAGE_UNITS={len(unique_pdf_images)}")

    if docs:
        print("FIRST_CHUNK_PREVIEW_BEGIN")
        print(docs[0][:600])
        print("FIRST_CHUNK_PREVIEW_END")

    query_result = await engine.query(
        teacher_id=teacher_id,
        collection_name=collection_name,
        question=args.question,
        top_k=args.top_k,
    )

    answer = (query_result.get("answer") or "").replace("\n", " ")
    print(f"QUERY_SOURCES_COUNT={len(query_result.get('sources', []))}")
    print("QUERY_ANSWER_PREVIEW_BEGIN")
    print(answer[:900])
    print("QUERY_ANSWER_PREVIEW_END")

    return 0


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return asyncio.run(run_test(args))


if __name__ == "__main__":
    raise SystemExit(main())
