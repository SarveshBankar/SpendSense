import uuid

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.statement import (
    StatementUploadResponse,
    StatementListResponse,
    StatementDeleteResponse,
    ParseRequest,
)
from app.schemas.transaction import ParseResultResponse
from app.services.statement import StatementService
from app.services.statement_parser import StatementParserService

router = APIRouter(prefix="/statements", tags=["statements"])


def _get_service(db: Session = Depends(get_db)) -> StatementService:
    return StatementService(db)


def _get_parser(db: Session = Depends(get_db)) -> StatementParserService:
    return StatementParserService(db)


@router.post(
    "/upload",
    response_model=StatementUploadResponse,
    status_code=201,
    summary="Upload a bank statement",
    description="Upload a CSV or PDF bank statement file. Maximum file size is 10 MB. "
    "The file is validated, stored on disk, and a database record is created. "
    "Returns a warning if a file with the same name was uploaded before.",
    responses={
        201: {"description": "File uploaded successfully"},
        400: {"description": "Invalid file type or size exceeded"},
        401: {"description": "Authentication required"},
    },
)
def upload_statement(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    service: StatementService = Depends(_get_service),
):
    return service.upload(current_user, file)


@router.get(
    "",
    response_model=StatementListResponse,
    summary="List all statements",
    description="Returns a list of all bank statements uploaded by the current user, "
    "including file metadata and processing status.",
    responses={
        200: {"description": "Statements retrieved"},
        401: {"description": "Authentication required"},
    },
)
def list_statements(
    current_user: User = Depends(get_current_user),
    service: StatementService = Depends(_get_service),
):
    return service.list_statements(current_user)


@router.post(
    "/{statement_id}/parse",
    response_model=ParseResultResponse,
    summary="Parse a statement into transactions",
    description="Processes an uploaded statement file and extracts individual transactions. "
    "Supports CSV and PDF formats. For password-protected PDFs, provide the password "
    "in the request body. Previously parsed transactions for this statement "
    "are replaced only on a successful parse. Each transaction is auto-categorized "
    "using the rule engine.",
    responses={
        200: {"description": "Statement parsed successfully"},
        400: {"description": "Password required, incorrect password, or unsupported file type"},
        401: {"description": "Authentication required"},
        404: {"description": "Statement not found"},
    },
)
def parse_statement(
    statement_id: uuid.UUID,
    body: ParseRequest | None = None,
    current_user: User = Depends(get_current_user),
    parser: StatementParserService = Depends(_get_parser),
):
    return parser.parse(
        current_user, statement_id, password=body.password if body else None
    )


@router.delete(
    "/{statement_id}",
    response_model=StatementDeleteResponse,
    summary="Delete a statement",
    description="Deletes a statement and its file from disk. Associated transactions "
    "are cascade-deleted from the database. Only the owner can delete their statements.",
    responses={
        200: {"description": "Statement deleted"},
        401: {"description": "Authentication required"},
        403: {"description": "Not the owner of this statement"},
        404: {"description": "Statement not found"},
    },
)
def delete_statement(
    statement_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: StatementService = Depends(_get_service),
):
    return service.delete_statement(current_user, statement_id)
