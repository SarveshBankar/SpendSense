import uuid
from collections import defaultdict
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.transaction import TransactionRepository
from app.services.analytics import AnalyticsService
from app.schemas.report import ReportData, ReportSummary, ReportResponse, ReportListResponse


class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = TransactionRepository()
        self.analytics = AnalyticsService(db)

    def monthly(self, current_user: User, month: int, year: int) -> ReportResponse:
        txs = self._filtered_txns(current_user, month=month, year=year)
        return self._build_report(txs, f"{year}-{month:02d}", current_user)

    def yearly(self, current_user: User, year: int) -> ReportResponse:
        txs = self._filtered_txns(current_user, year=year)
        return self._build_report(txs, str(year), current_user)

    def custom(self, current_user: User, start_date: str, end_date: str) -> ReportResponse:
        txs = self._filtered_txns(current_user, start_date=start_date, end_date=end_date)
        return self._build_report(txs, f"{start_date}–{end_date}", current_user)

    def list_available(self, current_user: User) -> ReportListResponse:
        txs = self.repo.list_by_user(self.db, current_user.id)
        months = set()
        years = set()
        for t in txs:
            months.add(t.date[:7])
            years.add(int(t.date[:4]))
        return ReportListResponse(
            available_months=sorted(months),
            available_years=sorted(years),
        )

    # ------------------------------------------------------------------ #
    def _build_report(self, txs, period_label: str, current_user: User) -> ReportResponse:
        income = [t for t in txs if t.transaction_type == "credit"]
        expense = [t for t in txs if t.transaction_type == "debit"]

        total_income = sum(t.amount for t in income)
        total_expense = sum(t.amount for t in expense)
        net = total_income - total_expense
        savings_rate = round((net / total_income * 100), 1) if total_income > 0 else 0
        expense_ratio = round((total_expense / total_income * 100), 1) if total_income > 0 else 0
        categorized = len([t for t in txs if t.category])
        cat_pct = round((categorized / len(txs) * 100), 0) if txs else 0
        unique_dates = len(set(t.date for t in txs))
        avg_daily = round(total_expense / unique_dates, 2) if unique_dates > 0 else 0

        # Category breakdown
        cat_spend: dict[str, float] = defaultdict(float)
        for t in expense:
            cat_spend[t.category or "Others"] += t.amount
        cat_breakdown = [{"category": k, "amount": round(v, 2)} for k, v in sorted(cat_spend.items(), key=lambda x: -x[1])]
        top_cat = cat_breakdown[0] if cat_breakdown else None

        # Merchant breakdown
        merch_spend: dict[str, float] = defaultdict(float)
        for t in expense:
            m = t.merchant or "Unknown"
            merch_spend[m] += t.amount
        merch_breakdown = [{"merchant": k, "amount": round(v, 2)} for k, v in sorted(merch_spend.items(), key=lambda x: -x[1])[:15]]
        top_merchant = merch_breakdown[0] if merch_breakdown else None

        # Monthly breakdown within period
        monthly: dict[str, dict] = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
        for t in txs:
            key = t.date[:7]
            if t.transaction_type == "credit":
                monthly[key]["income"] += t.amount
            else:
                monthly[key]["expense"] += t.amount
        monthly_bk = [{"month": k, "income": round(v["income"], 2), "expense": round(v["expense"], 2)}
                       for k, v in sorted(monthly.items())]

        # Daily trends
        daily: dict[str, float] = defaultdict(float)
        for t in expense:
            daily[t.date] += t.amount
        daily_trends = [{"date": k, "amount": round(v, 2)} for k, v in sorted(daily.items())]

        # Recommendations from analytics
        stats = {
            "savings_rate": savings_rate,
            "expense_ratio": expense_ratio,
            "categorized_pct": cat_pct,
            "total_transactions": len(txs),
            "total_income": total_income,
            "total_expense": total_expense,
        }
        recs = self.analytics._generate_recommendations(stats, [])
        top_recs = [r["description"] for r in recs[:3]]

        # Health score
        score = self.analytics._compute_health_score(stats)

        summary = ReportSummary(
            period=period_label,
            total_income=round(total_income, 2),
            total_expense=round(total_expense, 2),
            net_savings=round(net, 2),
            savings_rate=savings_rate,
            expense_ratio=expense_ratio,
            total_transactions=len(txs),
            categorized_pct=cat_pct,
            avg_daily_expense=avg_daily,
            highest_category=top_cat["category"] if top_cat else None,
            highest_category_amount=round(top_cat["amount"], 2) if top_cat else 0,
            top_merchant=top_merchant["merchant"] if top_merchant else None,
            top_merchant_amount=round(top_merchant["amount"], 2) if top_merchant else 0,
            health_score=score["score"],
        )

        return ReportResponse(
            report=ReportData(
                summary=summary,
                monthly_breakdown=monthly_bk,
                category_breakdown=cat_breakdown,
                merchant_breakdown=merch_breakdown,
                daily_trends=daily_trends,
                top_recommendations=top_recs,
            ),
            generated_at=datetime.utcnow().isoformat(),
        )

    def _filtered_txns(self, current_user: User, month: int | None = None, year: int | None = None,
                       start_date: str | None = None, end_date: str | None = None):
        txs = self.repo.list_by_user(self.db, current_user.id)
        if month is not None:
            txs = [t for t in txs if int(t.date[5:7]) == month]
        if year is not None:
            txs = [t for t in txs if int(t.date[:4]) == year]
        if start_date:
            txs = [t for t in txs if t.date >= start_date]
        if end_date:
            txs = [t for t in txs if t.date <= end_date]
        return txs
