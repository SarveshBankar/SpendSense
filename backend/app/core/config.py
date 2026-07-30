from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "SpendSense"
    version: str = "0.3.0"
    debug: bool = True
    database_url: str = "sqlite:///./spendsense.db"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    api_v1_prefix: str = "/api/v1"
    log_level: str = "INFO"

    jwt_secret_key: str = "change-me-to-a-long-random-secret-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60

    upload_max_size_mb: int = 10
    upload_dir: str = "uploads"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
