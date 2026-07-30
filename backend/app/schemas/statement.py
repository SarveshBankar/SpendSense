import uuid
from datetime import datetime

from pydantic import BaseModel


class StatementResponse(BaseModel):
    id: uuid.UUID
    original_file_name: str
    stored_file_name: str
    file_type: str
    file_size: int
    status: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class StatementUploadResponse(BaseModel):
    message: str
    statement: StatementResponse
    warning: str | None = None


class StatementListResponse(BaseModel):
    statements: list[StatementResponse]
    total: int


class StatementDeleteResponse(BaseModel):
    message: str
