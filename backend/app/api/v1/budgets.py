import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetListResponse,
    BudgetDeleteResponse,
)
from app.services.budget import BudgetService

router = APIRouter(prefix="/budgets", tags=["budgets"])


def _get_service(db: Session = Depends(get_db)) -> BudgetService:
    return BudgetService(db)


@router.get("", response_model=BudgetListResponse, summary="List budgets")
def list_budgets(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2020, le=2100),
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(_get_service),
):
    return service.list_budgets(current_user, month, year)


@router.post("", response_model=BudgetResponse, status_code=201, summary="Create a budget")
def create_budget(
    data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(_get_service),
):
    return service.create_budget(current_user, data)


@router.put("/{budget_id}", response_model=BudgetResponse, summary="Update a budget")
def update_budget(
    budget_id: uuid.UUID,
    data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(_get_service),
):
    return service.update_budget(current_user, budget_id, data)


@router.delete("/{budget_id}", response_model=BudgetDeleteResponse, summary="Delete a budget")
def delete_budget(
    budget_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(_get_service),
):
    return service.delete_budget(current_user, budget_id)
