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
    summary="Upload a bank statement (CSV or PDF)",
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
    summary="List all statements for the current user",
)
def list_statements(
    current_user: User = Depends(get_current_user),
    service: StatementService = Depends(_get_service),
):
    return service.list_statements(current_user)


@router.post(
    "/{statement_id}/parse",
    response_model=ParseResultResponse,
    summary="Parse a bank statement into transactions",
)
def parse_statement(
    statement_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    parser: StatementParserService = Depends(_get_parser),
):
    return parser.parse(current_user, statement_id)


@router.delete(
    "/{statement_id}",
    response_model=StatementDeleteResponse,
    summary="Delete a statement",
)
def delete_statement(
    statement_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: StatementService = Depends(_get_service),
):
    return service.delete_statement(current_user, statement_id)
