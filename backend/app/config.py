from pydantic_settings import BaseSettings
from typing import Optional, Union, List
import secrets
import os


class Settings(BaseSettings):
    APP_NAME: str = "AICTE Compliance Platform"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = "aicte-regulatory-super-secret-production-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    DATABASE_URL: str = "postgresql://postgres.truohpsitrrbransgxuo:Dhaya%4020065667@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
    UPLOAD_DIR: str = "./storage/uploads"
    MAX_UPLOAD_MB: int = 10
    CORS_ORIGINS: Union[List[str], str] = ["*"]
    GEMINI_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
