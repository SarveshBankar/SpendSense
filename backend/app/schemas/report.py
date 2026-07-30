from pydantic import BaseModel


class ReportSummary(BaseModel):
    period: str
    total_income: float
    total_expense: float
    net_savings: float
    savings_rate: float
    expense_ratio: float
    total_transactions: int
    categorized_pct: float
    avg_daily_expense: float
    highest_category: str | None = None
    highest_category_amount: float = 0
    top_merchant: str | None = None
    top_merchant_amount: float = 0
    budget_summary: dict | None = None
    goals_summary: dict | None = None
    health_score: int | None = None


class ReportData(BaseModel):
    summary: ReportSummary
    monthly_breakdown: list[dict]
    category_breakdown: list[dict]
    merchant_breakdown: list[dict]
    daily_trends: list[dict]
    top_recommendations: list[str]


class ReportResponse(BaseModel):
    report: ReportData
    generated_at: str


class ReportListResponse(BaseModel):
    available_months: list[str]
    available_years: list[int]
