import os
import uuid
from pathlib import Path

from fastapi import UploadFile, HTTPException, status

ALLOWED_EXTENSIONS = {".csv", ".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024


def validate_upload_file(file: UploadFile) -> tuple[str, str]:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Allowed: CSV, PDF",
        )

    content = file.file.read()
    file_size = len(content)
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds 10 MB limit",
        )

    if ext == ".pdf":
        if not content.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File appears not to be a valid PDF",
            )

    stored_name = f"{uuid.uuid4().hex}{ext}"
    return stored_name, ext


def ensure_upload_dir(upload_dir: str) -> Path:
    path = Path(upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_upload(file: UploadFile, upload_dir: str, stored_name: str) -> str:
    path = ensure_upload_dir(upload_dir)
    file_path = path / stored_name
    content = file.file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    return str(file_path)


def get_file_path(user_id: str, stored_name: str) -> Path:
    from app.core.config import get_settings
    settings = get_settings()
    return Path(settings.upload_dir) / stored_name


def delete_file(file_path: str) -> None:
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except OSError:
        pass
