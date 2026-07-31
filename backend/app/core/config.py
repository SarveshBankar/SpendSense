from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "SpendSense"
    version: str = "0.5.0"
    debug: bool = True
    database_url: str = "sqlite:///./spendsense.db"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    api_v1_prefix: str = "/api/v1"
    log_level: str = "INFO"
    log_file: str = "logs/spendsense.log"
    log_max_bytes: int = 10 * 1024 * 1024
    log_backup_count: int = 5

    jwt_secret_key: str = "change-me-to-a-long-random-secret-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    jwt_refresh_expiration_days: int = 7

    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60

    upload_max_size_mb: int = 10
    upload_dir: str = "uploads"

    secure_headers_enabled: bool = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
