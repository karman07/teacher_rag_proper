"""
config.py — Application settings loaded from .env
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── GPU Gateway ────────────────────────────────────────────────────────
    gpu_gateway_url: str = "https://8080-66976dwa2.brevlab.com"

    # ── Local paths ────────────────────────────────────────────────────────
    uploads_root: str = "../backend/uploads"

    # ── Service ────────────────────────────────────────────────────────────
    rag_host: str = "0.0.0.0"
    rag_port: int = 8000

    # ── PDF processing ─────────────────────────────────────────────────────
    pdf_max_pages: int = 20
    pdf_max_images_per_page: int = 10
    pdf_min_image_area: int = 40000
    pdf_vision_concurrency: int = 4

    # ── Models (served by the GPU cluster) ─────────────────────────────────
    llm_model_name: str = "llama70b"
    vision_model_name: str = "qwen-vl"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
