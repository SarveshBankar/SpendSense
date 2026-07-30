from pydantic import BaseModel


class InsightCard(BaseModel):
    type: str
    label: str
    value: str
    detail: str
    severity: str  # "info" | "success" | "warning" | "danger"


class HealthScore(BaseModel):
    score: int
    savings_rate_score: float
    expense_ratio_score: float
    categorization_score: float
    volume_score: float
    stability_score: float
    breakdown: dict


class Recommendation(BaseModel):
    type: str
    title: str
    description: str
    priority: str  # "high" | "medium" | "low"


class CategoryBreakdown(BaseModel):
    category: str
    amount: float


class TopMerchant(BaseModel):
    merchant: str
    amount: float


class Statistics(BaseModel):
    total_transactions: int
    total_income: float
    total_expense: float
    net_savings: float
    savings_rate: float
    expense_ratio: float
    categorized_pct: float
    average_transaction: float
    category_breakdown: list[CategoryBreakdown]
    top_merchants: list[TopMerchant]
    first_date: str | None = None
    last_date: str | None = None


class InsightsResponse(BaseModel):
    financial_score: HealthScore
    summary: str
    recommendations: list[Recommendation]
    insights: list[InsightCard]
    statistics: Statistics
