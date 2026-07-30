from datetime import date

from pydantic import BaseModel


class KPIs(BaseModel):
    total_income: float
    total_expense: float
    net_savings: float
    savings_rate: float
    expense_ratio: float
    total_transactions: int
    avg_daily_expense: float
    avg_monthly_expense: float
    highest_spending_day: str | None = None
    highest_spending_amount: float = 0
    lowest_spending_day: str | None = None
    lowest_spending_amount: float = 0
    volatility_score: float
    categorized_pct: float
    first_date: str | None = None
    last_date: str | None = None


class MonthlyTrend(BaseModel):
    month: str
    income: float
    expense: float
    net: float


class WeeklyTrend(BaseModel):
    week_start: str
    income: float
    expense: float
    net: float


class DailyTrend(BaseModel):
    date: str
    income: float
    expense: float
    net: float


class CategoryGrowth(BaseModel):
    category: str
    monthly: list[dict]


class MerchantSpending(BaseModel):
    merchant: str
    total: float
    transaction_count: int
    avg_amount: float
    category: str | None = None
    last_date: str | None = None


class SubscriptionInfo(BaseModel):
    merchant: str
    monthly_avg: float
    occurrences: int
    last_date: str | None = None
    confidence: str


class IncomeSource(BaseModel):
    description: str
    total: float
    count: int
    last_date: str | None = None


class SpendingDistribution(BaseModel):
    range_label: str
    count: int
    total: float


class CashFlowPoint(BaseModel):
    date: str
    cumulative_income: float
    cumulative_expense: float
    net_position: float


class Prediction(BaseModel):
    expected_month_end_spending: float
    expected_month_end_savings: float
    budget_risk_level: str
    estimated_health_next_month: int


class CalendarDay(BaseModel):
    date: str
    amount: float
    transaction_count: int


class AnalyticsResponse(BaseModel):
    kpis: KPIs
    monthly_trends: list[MonthlyTrend]
    weekly_trends: list[WeeklyTrend]
    daily_trends: list[DailyTrend]
    category_growth: list[CategoryGrowth]
    merchant_spending: list[MerchantSpending]
    subscriptions: list[SubscriptionInfo]
    income_sources: list[IncomeSource]
    spending_distribution: list[SpendingDistribution]
    cash_flow: list[CashFlowPoint]
    predictions: Prediction
    calendar_heatmap: list[CalendarDay]
    filters: dict
