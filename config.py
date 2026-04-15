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

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
