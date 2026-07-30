import uuid
from datetime import datetime, date
from calendar import monthrange

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.transaction import Transaction
from app.repositories.budget import BudgetRepository
from app.repositories.transaction import TransactionRepository
from app.schemas.budget import (
    BudgetResponse,
    BudgetCreate,
    BudgetUpdate,
    BudgetListResponse,
    BudgetDeleteResponse,
)


class BudgetService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = BudgetRepository()
        self.tx_repo = TransactionRepository()

    # ------------------------------------------------------------------ #
    #  List
    # ------------------------------------------------------------------ #
    def list_budgets(
        self,
        current_user: User,
        month: int | None = None,
        year: int | None = None,
    ) -> BudgetListResponse:
        now = datetime.utcnow()
        m = month or now.month
        y = year or now.year

        budgets = self.repo.list_by_user(self.db, current_user.id, m, y)
        responses = [self._enrich(current_user, b) for b in budgets]

        total_budgeted = sum(r.monthly_budget for r in responses)
        total_spent = sum(r.current_spent for r in responses)

        return BudgetListResponse(
            budgets=responses,
            total=len(responses),
            total_budgeted=round(total_budgeted, 2),
            total_spent=round(total_spent, 2),
            total_remaining=round(total_budgeted - total_spent, 2),
            overall_utilization=round((total_spent / total_budgeted * 100), 1) if total_budgeted > 0 else 0,
        )

    # ------------------------------------------------------------------ #
    #  Create
    # ------------------------------------------------------------------ #
    def create_budget(self, current_user: User, data: BudgetCreate) -> BudgetResponse:
        existing = self.repo.list_by_user(
            self.db, current_user.id, data.month, data.year
        )
        if data.category:
            for b in existing:
                if b.category == data.category:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Budget for category '{data.category}' already exists in {data.month}/{data.year}",
                    )

        budget = self.repo.create(
            self.db, current_user.id, data.model_dump()
        )
        return self._enrich(current_user, budget)

    # ------------------------------------------------------------------ #
    #  Update
    # ------------------------------------------------------------------ #
    def update_budget(
        self, current_user: User, budget_id: uuid.UUID, data: BudgetUpdate
    ) -> BudgetResponse:
        budget = self.repo.get_by_id(self.db, budget_id)
        if not budget:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
        if budget.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your budget")

        updates = data.model_dump(exclude_none=True)
        budget = self.repo.update(self.db, budget, updates)
        return self._enrich(current_user, budget)

    # ------------------------------------------------------------------ #
    #  Delete
    # ------------------------------------------------------------------ #
    def delete_budget(
        self, current_user: User, budget_id: uuid.UUID
    ) -> BudgetDeleteResponse:
        budget = self.repo.get_by_id(self.db, budget_id)
        if not budget:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
        if budget.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your budget")
        self.repo.delete(self.db, budget)
        return BudgetDeleteResponse(message="Budget deleted successfully")

    # ------------------------------------------------------------------ #
    #  Enrich a budget with computed fields
    # ------------------------------------------------------------------ #
    def _enrich(self, current_user: User, budget) -> BudgetResponse:
        # Get expense transactions for this user in the budget month/year
        all_txns = self.tx_repo.list_by_user(self.db, current_user.id)
        month_str = f"{budget.year}-{budget.month:02d}"

        # Filter by month
        month_txns = [
            t for t in all_txns
            if t.transaction_type == "debit" and t.date.startswith(month_str)
        ]

        # Filter by category if budget has one
        if budget.category:
            cat_txns = [t for t in month_txns if t.category == budget.category]
        else:
            cat_txns = month_txns

        current_spent = round(sum(t.amount for t in cat_txns), 2)
        remaining = round(budget.monthly_budget - current_spent, 2)

        # Days in month
        _, days_in_month = monthrange(budget.year, budget.month)
        today = date.today()
        day_of_month = min(today.day, days_in_month) if today.year == budget.year and today.month == budget.month else days_in_month
        days_remaining = max(1, days_in_month - day_of_month + 1)

        # Daily allowance
        daily_allowance = round(remaining / days_remaining, 2) if days_remaining > 0 else 0

        # Predicted month-end spending
        if day_of_month > 0:
            daily_avg = round(current_spent / day_of_month, 2) if day_of_month > 0 else 0
            predicted_end = round(daily_avg * days_in_month, 2)
        else:
            predicted_end = 0

        overspending = predicted_end > budget.monthly_budget
        utilization = round((current_spent / budget.monthly_budget * 100), 1) if budget.monthly_budget > 0 else 0

        return BudgetResponse(
            id=budget.id,
            user_id=budget.user_id,
            category=budget.category,
            monthly_budget=budget.monthly_budget,
            month=budget.month,
            year=budget.year,
            created_at=budget.created_at,
            current_spent=current_spent,
            remaining_budget=remaining,
            utilization_pct=utilization,
            daily_allowance=daily_allowance,
            predicted_end=predicted_end,
            overspending=overspending,
        )
