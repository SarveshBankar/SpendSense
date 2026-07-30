from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "SpendSense"
    version: str = "0.2.0"
    debug: bool = True
    database_url: str = "sqlite:///./spendsense.db"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    api_v1_prefix: str = "/api/v1"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
