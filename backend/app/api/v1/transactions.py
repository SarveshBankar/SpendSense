from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.transaction import TransactionRepository
from app.schemas.transaction import (
    TransactionListResponse,
    TransactionResponse,
    CategorizationSummaryResponse,
)
from app.services.categorization import (
    CategorizationService,
    get_categorization_service,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _get_repo(db: Session = Depends(get_db)) -> TransactionRepository:
    return TransactionRepository()


@router.get(
    "",
    response_model=TransactionListResponse,
    summary="List all transactions for the current user",
)
def list_transactions(
    current_user: User = Depends(get_current_user),
    repo: TransactionRepository = Depends(_get_repo),
    db: Session = Depends(get_db),
):
    transactions = repo.list_by_user(db, current_user.id)
    total = repo.count_by_user(db, current_user.id)
    return TransactionListResponse(
        transactions=[
            TransactionResponse.model_validate(t) for t in transactions
        ],
        total=total,
    )


@router.post(
    "/categorize",
    response_model=CategorizationSummaryResponse,
    summary="Categorize all transactions for the current user",
)
def categorize_transactions(
    current_user: User = Depends(get_current_user),
    service: CategorizationService = Depends(get_categorization_service),
):
    return service.categorize_all(current_user)
