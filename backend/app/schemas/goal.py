import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class GoalBase(BaseModel):
    goal_name: str
    target_amount: float
    current_amount: float = 0.0
    target_date: str

    @field_validator("target_amount")
    @classmethod
    def positive_target(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("target_amount must be positive")
        return v

    @field_validator("current_amount")
    @classmethod
    def non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("current_amount cannot be negative")
        return v

    @field_validator("target_date")
    @classmethod
    def date_format(cls, v: str) -> str:
        from datetime import datetime as dt
        try:
            dt.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("target_date must be in YYYY-MM-DD format")
        return v


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    goal_name: str | None = None
    target_amount: float | None = None
    current_amount: float | None = None
    target_date: str | None = None
    status: str | None = None


class GoalResponse(GoalBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    created_at: datetime

    # Computed
    progress_pct: float = 0.0
    remaining_amount: float = 0.0

    model_config = {"from_attributes": True}


class GoalListResponse(BaseModel):
    goals: list[GoalResponse]
    total: int
    total_target: float
    total_saved: float
    overall_progress: float


class GoalDeleteResponse(BaseModel):
    message: str
