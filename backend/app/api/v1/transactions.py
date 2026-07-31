from fastapi import APIRouter, Depends, Query
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
from app.services.categorization import CategorizationService, get_categorization_service

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _get_repo(db: Session = Depends(get_db)) -> TransactionRepository:
    return TransactionRepository()


@router.get(
    "",
    response_model=TransactionListResponse,
    summary="List all transactions",
    description="Returns paginated, filterable transactions for the current user. "
    "Supports search, type/category/date filters, and sorting.",
    responses={
        200: {"description": "Transactions retrieved"},
        401: {"description": "Authentication required"},
    },
)
def list_transactions(
    current_user: User = Depends(get_current_user),
    repo: TransactionRepository = Depends(_get_repo),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    sort_by: str = Query("date", description="Sort column (date, amount, description)"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort direction"),
    search: str | None = Query(None, description="Search in description"),
    transaction_type: str | None = Query(None, description="Filter by type (credit/debit)"),
    category: str | None = Query(None, description="Filter by category"),
    from_date: str | None = Query(None, alias="from", description="Start date (YYYY-MM-DD)"),
    to_date: str | None = Query(None, alias="to", description="End date (YYYY-MM-DD)"),
):
    transactions = repo.list_by_user(
        db, current_user.id,
        skip=skip, limit=limit,
        sort_by=sort_by, sort_order=sort_order,
        search=search,
        transaction_type=transaction_type,
        category=category,
        from_date=from_date,
        to_date=to_date,
    )
    total = repo.count_by_user(
        db, current_user.id,
        search=search,
        transaction_type=transaction_type,
        category=category,
        from_date=from_date,
        to_date=to_date,
    )
    return TransactionListResponse(
        transactions=[
            TransactionResponse.model_validate(t) for t in transactions
        ],
        total=total,
    )


@router.post(
    "/categorize",
    response_model=CategorizationSummaryResponse,
    summary="Categorize all transactions",
    description="Runs the rule-based categorization engine on all uncategorized transactions "
    "for the current user. Returns a summary of categorized vs uncategorized counts "
    "and a category-wise breakdown.",
    responses={
        200: {"description": "Categorization completed"},
        401: {"description": "Authentication required"},
    },
)
def categorize_transactions(
    current_user: User = Depends(get_current_user),
    service: CategorizationService = Depends(get_categorization_service),
):
    return service.categorize_all(current_user)
