"""
config.py — Application settings loaded from .env
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    gemini_api_key: str
    chroma_persist_dir: str = "./chroma_db"
    uploads_root: str = "../backend/uploads"
    rag_host: str = "0.0.0.0"
    rag_port: int = 8000
    image_caption_backend: str = "gemini"
    vision_model_name: str = "models/gemini-2.5-flash"
    blip_model_name: str = "Salesforce/blip-image-captioning-base"
    pdf_max_pages: int = 20
    pdf_max_images_per_page: int = 2
    pdf_min_image_area: int = 40000
    pdf_vision_concurrency: int = 4

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
