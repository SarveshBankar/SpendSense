import uuid
from pathlib import Path

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.user import User
from app.repositories.statement import StatementRepository
from app.schemas.statement import (
    StatementResponse,
    StatementUploadResponse,
    StatementListResponse,
    StatementDeleteResponse,
)
from app.utils.file_storage import validate_upload_file, save_upload, delete_file
from app.utils.pdf_security import is_pdf_encrypted

settings = get_settings()


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

        stored_name, ext = validate_upload_file(file)

        existing_count = self.repo.count_by_original_name(
            self.db, current_user.id, filename
        )
        warning: str | None = None
        if existing_count > 0:
            warning = f"A file named '{filename}' has already been uploaded ({existing_count} time(s))"

        file_path = save_upload(file, settings.upload_dir, stored_name)

        file.file.seek(0, 2)
        actual_size = file.file.tell()
        file.file.seek(0)

        password_protected = (
            is_pdf_encrypted(file_path) if ext.lower() == ".pdf" else False
        )

        statement = self.repo.create(
            self.db,
            current_user.id,
            filename,
            stored_name,
            ext.lstrip("."),
            actual_size,
            password_protected=password_protected,
        )

        if password_protected:
            warning = (
                f"{warning + ' ' if warning else ''}"
                "This PDF is password protected. You'll need its password to parse it."
            )

        return StatementUploadResponse(
            message="File uploaded successfully",
            statement=StatementResponse.model_validate(statement),
            warning=warning,
        )

    def list_statements(self, current_user: User) -> StatementListResponse:
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

        stored_path = Path(settings.upload_dir) / statement.stored_file_name
        delete_file(str(stored_path))
        self.repo.delete(self.db, statement)

        return StatementDeleteResponse(message="Statement deleted successfully")
