import uuid
from pathlib import Path

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.statement import StatementRepository
from app.schemas.statement import (
    StatementResponse,
    StatementUploadResponse,
    StatementListResponse,
    StatementDeleteResponse,
)
from app.utils.file_storage import save_upload, delete_upload

ALLOWED_EXTENSIONS = {".csv", ".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024


class StatementService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = StatementRepository()

    def upload(self, current_user: User, file: UploadFile) -> StatementUploadResponse:
        filename = file.filename or ""

        if not filename.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File name is required",
            )

        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type '{ext}'. Only CSV and PDF files are allowed.",
            )

        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty",
            )

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds 10 MB limit",
            )

        existing_count = self.repo.count_by_original_name(
            self.db, current_user.id, filename
        )
        warning: str | None = None
        if existing_count > 0:
            warning = f"A file named '{filename}' has already been uploaded ({existing_count} time(s))"

        stored_name, actual_size = save_upload(str(current_user.id), file)
        statement = self.repo.create(
            self.db,
            current_user.id,
            filename,
            stored_name,
            ext.lstrip("."),
            actual_size,
        )

        return StatementUploadResponse(
            message="File uploaded successfully",
            statement=StatementResponse.model_validate(statement),
            warning=warning,
        )

    def list_statements(
        self, current_user: User
    ) -> StatementListResponse:
        statements = self.repo.list_by_user(self.db, current_user.id)
        total = self.repo.count_by_user(self.db, current_user.id)
        return StatementListResponse(
            statements=[
                StatementResponse.model_validate(s) for s in statements
            ],
            total=total,
        )

    def delete_statement(
        self, current_user: User, statement_id: uuid.UUID
    ) -> StatementDeleteResponse:
        statement = self.repo.get_by_id(self.db, statement_id)
        if not statement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Statement not found",
            )
        if statement.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this statement",
            )

        delete_upload(str(current_user.id), statement.stored_file_name)
        self.repo.delete(self.db, statement)

        return StatementDeleteResponse(message="Statement deleted successfully")
