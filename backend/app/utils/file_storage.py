import os
import uuid
from pathlib import Path

from fastapi import UploadFile


UPLOAD_ROOT = Path("uploads")


def _ensure_user_dir(user_id: str) -> Path:
    path = UPLOAD_ROOT / user_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_upload(user_id: str, file: UploadFile) -> tuple[str, int]:
    user_dir = _ensure_user_dir(user_id)
    ext = Path(file.filename or "unknown").suffix
    stored_name = f"{uuid.uuid4()}{ext}"
    file_path = user_dir / stored_name

    content = file.file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return stored_name, len(content)


def delete_upload(user_id: str, stored_file_name: str) -> None:
    file_path = UPLOAD_ROOT / user_id / stored_file_name
    if file_path.exists():
        os.remove(file_path)


def get_file_path(user_id: str, stored_file_name: str) -> Path:
    return UPLOAD_ROOT / user_id / stored_file_name
