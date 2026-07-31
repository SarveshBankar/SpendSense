import uuid
from datetime import datetime

from pydantic import BaseModel


class AnomalyResponse(BaseModel):
    id: uuid.UUID
    type: str
    severity: str
    description: str
    amount: float | None = None
    category: str | None = None
    resolved: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AnomalyListResponse(BaseModel):
    anomalies: list[AnomalyResponse]
    unresolved_count: int
    total: int


class AnomalyResolveResponse(BaseModel):
    message: str


class PredictionResponse(BaseModel):
    predicted_expense: float
    predicted_income: float
    predicted_savings: float
    prediction_confidence: str
    budget_risk: str
    category_predictions: list[dict]
    next_month: str


class HealthScoreResponse(BaseModel):
    score: int
    grade: str
    grade_label: str
    breakdown: dict
    explanation: str
    suggestions: list[str]
