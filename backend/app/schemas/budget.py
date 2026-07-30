import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class BudgetBase(BaseModel):
    category: str | None = None
    monthly_budget: float
    month: int
    year: int

    @field_validator("month")
    @classmethod
    def month_range(cls, v: int) -> int:
        if v < 1 or v > 12:
            raise ValueError("month must be between 1 and 12")
        return v

    @field_validator("year")
    @classmethod
    def year_range(cls, v: int) -> int:
        if v < 2020 or v > 2100:
            raise ValueError("year must be between 2020 and 2100")
        return v

    @field_validator("monthly_budget")
    @classmethod
    def positive_budget(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("monthly_budget must be positive")
        return v


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    category: str | None = None
    monthly_budget: float | None = None
    month: int | None = None
    year: int | None = None


class BudgetResponse(BudgetBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    # Computed fields
    current_spent: float = 0.0
    remaining_budget: float = 0.0
    utilization_pct: float = 0.0
    daily_allowance: float = 0.0
    predicted_end: float = 0.0
    overspending: bool = False

    model_config = {"from_attributes": True}


class BudgetListResponse(BaseModel):
    budgets: list[BudgetResponse]
    total: float
    total_budgeted: float
    total_spent: float
    total_remaining: float
    overall_utilization: float


class BudgetDeleteResponse(BaseModel):
    message: str
