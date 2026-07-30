import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.repositories.transaction import TransactionRepository


class AdvancedAnalyticsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = TransactionRepository()

    def generate(
        self,
        user_id: uuid.UUID,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        month: Optional[int] = None,
        year: Optional[int] = None,
        category: Optional[str] = None,
        merchant: Optional[str] = None,
    ) -> dict:
        txs = self.repo.list_by_user(self.db, user_id)
        if not txs:
            return self._empty_response()

        txs = self._apply_filters(txs, start_date, end_date, month, year, category, merchant)

        return {
            "kpis": self._compute_kpis(txs),
            "monthly_trends": self._monthly_trends(txs),
            "weekly_trends": self._weekly_trends(txs),
            "daily_trends": self._daily_trends(txs),
            "category_growth": self._category_growth(txs),
            "merchant_spending": self._merchant_spending(txs),
            "subscriptions": self._detect_subscriptions(txs),
            "income_sources": self._income_sources(txs),
            "spending_distribution": self._spending_distribution(txs),
            "cash_flow": self._cash_flow(txs),
            "predictions": self._predictions(txs),
            "calendar_heatmap": self._calendar_heatmap(txs),
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "month": month,
                "year": year,
                "category": category,
                "merchant": merchant,
            },
        }

    def _apply_filters(
        self,
        txs: list[Transaction],
        start_date: Optional[str],
        end_date: Optional[str],
        month: Optional[int],
        year: Optional[int],
        category: Optional[str],
        merchant: Optional[str],
    ) -> list[Transaction]:
        if start_date:
            txs = [t for t in txs if t.date >= start_date]
        if end_date:
            txs = [t for t in txs if t.date <= end_date]
        if month is not None:
            txs = [t for t in txs if int(t.date[5:7]) == month]
        if year is not None:
            txs = [t for t in txs if int(t.date[:4]) == year]
        if category:
            txs = [t for t in txs if (t.category or "").lower() == category.lower()]
        if merchant:
            txs = [t for t in txs if (t.merchant or "").lower() == merchant.lower()]
        return txs

    # ------------------------------------------------------------------ #
    #  KPIs
    # ------------------------------------------------------------------ #
    def _compute_kpis(self, txs: list[Transaction]) -> dict:
        income = [t for t in txs if t.transaction_type == "credit"]
        expense = [t for t in txs if t.transaction_type == "debit"]

        total_income = sum(t.amount for t in income)
        total_expense = sum(t.amount for t in expense)
        net = total_income - total_expense
        savings_rate = round((net / total_income * 100), 1) if total_income > 0 else 0.0
        expense_ratio = round((total_expense / total_income * 100), 1) if total_income > 0 else 0.0

        categorized = len([t for t in txs if t.category])
        cat_pct = round((categorized / len(txs) * 100), 0) if txs else 0

        # Daily averages
        unique_dates = len(set(t.date for t in txs))
        avg_daily_expense = round(total_expense / unique_dates, 2) if unique_dates > 0 else 0
        avg_monthly_expense = round(total_expense / max(1, unique_dates / 30), 2)

        # Highest / lowest spending days
        day_spend: dict[str, float] = defaultdict(float)
        for t in expense:
            day_spend[t.date] += t.amount
        sorted_days = sorted(day_spend.items(), key=lambda x: -x[1])
        highest_day = sorted_days[0] if sorted_days else (None, 0)
        lowest_day = sorted_days[-1] if sorted_days else (None, 0)

        # Volatility (coefficient of variation of daily expense)
        if day_spend:
            values = list(day_spend.values())
            mean = sum(values) / len(values)
            variance = sum((v - mean) ** 2 for v in values) / len(values)
            std_dev = variance ** 0.5
            volatility_score = round((std_dev / mean * 100), 1) if mean > 0 else 0
        else:
            volatility_score = 0

        dates = sorted(set(t.date for t in txs))

        return {
            "total_income": round(total_income, 2),
            "total_expense": round(total_expense, 2),
            "net_savings": round(net, 2),
            "savings_rate": savings_rate,
            "expense_ratio": expense_ratio,
            "total_transactions": len(txs),
            "avg_daily_expense": avg_daily_expense,
            "avg_monthly_expense": avg_monthly_expense,
            "highest_spending_day": highest_day[0],
            "highest_spending_amount": round(highest_day[1], 2),
            "lowest_spending_day": lowest_day[0],
            "lowest_spending_amount": round(lowest_day[1], 2),
            "volatility_score": volatility_score,
            "categorized_pct": cat_pct,
            "first_date": dates[0] if dates else None,
            "last_date": dates[-1] if dates else None,
        }

    # ------------------------------------------------------------------ #
    #  Monthly trends
    # ------------------------------------------------------------------ #
    def _monthly_trends(self, txs: list[Transaction]) -> list[dict]:
        monthly: dict[str, dict] = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
        for t in txs:
            key = t.date[:7]
            if t.transaction_type == "credit":
                monthly[key]["income"] += t.amount
            else:
                monthly[key]["expense"] += t.amount
        result = []
        for month_key in sorted(monthly.keys()):
            inc = monthly[month_key]["income"]
            exp = monthly[month_key]["expense"]
            result.append({
                "month": month_key,
                "income": round(inc, 2),
                "expense": round(exp, 2),
                "net": round(inc - exp, 2),
            })
        return result

    # ------------------------------------------------------------------ #
    #  Weekly trends
    # ------------------------------------------------------------------ #
    def _weekly_trends(self, txs: list[Transaction]) -> list[dict]:
        weekly: dict[str, dict] = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
        for t in txs:
            try:
                dt = datetime.strptime(t.date, "%Y-%m-%d")
                week_start = (dt - timedelta(days=dt.weekday())).strftime("%Y-%m-%d")
                if t.transaction_type == "credit":
                    weekly[week_start]["income"] += t.amount
                else:
                    weekly[week_start]["expense"] += t.amount
            except ValueError:
                pass
        result = []
        for wk in sorted(weekly.keys()):
            inc = weekly[wk]["income"]
            exp = weekly[wk]["expense"]
            result.append({
                "week_start": wk,
                "income": round(inc, 2),
                "expense": round(exp, 2),
                "net": round(inc - exp, 2),
            })
        return result

    # ------------------------------------------------------------------ #
    #  Daily trends
    # ------------------------------------------------------------------ #
    def _daily_trends(self, txs: list[Transaction]) -> list[dict]:
        daily: dict[str, dict] = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
        for t in txs:
            if t.transaction_type == "credit":
                daily[t.date]["income"] += t.amount
            else:
                daily[t.date]["expense"] += t.amount
        result = []
        for d in sorted(daily.keys()):
            inc = daily[d]["income"]
            exp = daily[d]["expense"]
            result.append({
                "date": d,
                "income": round(inc, 2),
                "expense": round(exp, 2),
                "net": round(inc - exp, 2),
            })
        return result

    # ------------------------------------------------------------------ #
    #  Category growth (monthly trends per category)
    # ------------------------------------------------------------------ #
    def _category_growth(self, txs: list[Transaction]) -> list[dict]:
        cat_monthly: dict[str, dict] = defaultdict(lambda: defaultdict(float))
        for t in txs:
            if t.transaction_type == "debit":
                cat = t.category or "Others"
                cat_monthly[cat][t.date[:7]] += t.amount
        result = []
        for cat in sorted(cat_monthly.keys()):
            monthly_data = []
            for m in sorted(cat_monthly[cat].keys()):
                monthly_data.append({"month": m, "amount": round(cat_monthly[cat][m], 2)})
            result.append({"category": cat, "monthly": monthly_data})
        return result

    # ------------------------------------------------------------------ #
    #  Merchant spending
    # ------------------------------------------------------------------ #
    def _merchant_spending(self, txs: list[Transaction]) -> list[dict]:
        merchant_data: dict[str, dict] = defaultdict(lambda: {
            "total": 0.0, "count": 0, "amounts": [], "category": None, "last_date": None
        })
        for t in txs:
            if t.transaction_type == "debit" and t.merchant:
                m = t.merchant
                merchant_data[m]["total"] += t.amount
                merchant_data[m]["count"] += 1
                merchant_data[m]["amounts"].append(t.amount)
                merchant_data[m]["category"] = t.category
                if not merchant_data[m]["last_date"] or t.date > merchant_data[m]["last_date"]:
                    merchant_data[m]["last_date"] = t.date
        result = []
        for merchant, md in sorted(merchant_data.items(), key=lambda x: -x[1]["total"]):
            result.append({
                "merchant": merchant,
                "total": round(md["total"], 2),
                "transaction_count": md["count"],
                "avg_amount": round(md["total"] / md["count"], 2) if md["count"] > 0 else 0,
                "category": md["category"],
                "last_date": md["last_date"],
            })
        return result

    # ------------------------------------------------------------------ #
    #  Subscription detection
    # ------------------------------------------------------------------ #
    def _detect_subscriptions(self, txs: list[Transaction]) -> list[dict]:
        merchant_data: dict[str, list[dict]] = defaultdict(list)
        for t in txs:
            if t.transaction_type == "debit":
                key = t.merchant or t.description.strip().lower()
                merchant_data[key].append({"amount": t.amount, "date": t.date, "merchant": t.merchant, "desc": t.description})

        subscriptions = []
        for merchant, entries in merchant_data.items():
            if len(entries) >= 2:
                amounts = [e["amount"] for e in entries]
                avg = sum(amounts) / len(amounts)
                # Check regularity — amounts within 40% of average
                if all(abs(a - avg) / avg <= 0.4 for a in amounts):
                    dates_sorted = sorted(e["date"] for e in entries)
                    # Check dates are roughly monthly or bi-weekly
                    date_diffs = []
                    for i in range(1, len(dates_sorted)):
                        try:
                            d1 = datetime.strptime(dates_sorted[i - 1], "%Y-%m-%d")
                            d2 = datetime.strptime(dates_sorted[i], "%Y-%m-%d")
                            date_diffs.append((d2 - d1).days)
                        except ValueError:
                            pass
                    if date_diffs:
                        avg_diff = sum(date_diffs) / len(date_diffs)
                        # Accept if average interval is 15–45 days (bi-weekly to monthly)
                        if 15 <= avg_diff <= 45:
                            confidence = "high" if avg_diff >= 25 else "medium"
                        else:
                            continue
                    else:
                        confidence = "low"

                    display_name = entries[0].merchant or entries[0].desc[:40]
                    subscriptions.append({
                        "merchant": display_name,
                        "monthly_avg": round(avg, 2),
                        "occurrences": len(entries),
                        "last_date": max(e["date"] for e in entries),
                        "confidence": confidence,
                    })

        subscriptions.sort(key=lambda x: -x["monthly_avg"])
        return subscriptions

    # ------------------------------------------------------------------ #
    #  Income sources
    # ------------------------------------------------------------------ #
    def _income_sources(self, txs: list[Transaction]) -> list[dict]:
        income_data: dict[str, dict] = defaultdict(lambda: {"total": 0.0, "count": 0, "last_date": None})
        for t in txs:
            if t.transaction_type == "credit":
                desc = t.description.strip()[:100]
                income_data[desc]["total"] += t.amount
                income_data[desc]["count"] += 1
                if not income_data[desc]["last_date"] or t.date > income_data[desc]["last_date"]:
                    income_data[desc]["last_date"] = t.date
        result = []
        for desc, d in sorted(income_data.items(), key=lambda x: -x[1]["total"]):
            result.append({
                "description": desc,
                "total": round(d["total"], 2),
                "count": d["count"],
                "last_date": d["last_date"],
            })
        return result

    # ------------------------------------------------------------------ #
    #  Spending distribution
    # ------------------------------------------------------------------ #
    def _spending_distribution(self, txs: list[Transaction]) -> list[dict]:
        expense = [t for t in txs if t.transaction_type == "debit"]
        brackets = [
            (0, 100, "₹0–100"),
            (100, 500, "₹100–500"),
            (500, 2000, "₹500–2K"),
            (2000, 10000, "₹2K–10K"),
            (10000, float("inf"), "₹10K+"),
        ]
        result = []
        for lo, hi, label in brackets:
            matched = [t for t in expense if lo <= t.amount < hi]
            if matched:
                result.append({
                    "range_label": label,
                    "count": len(matched),
                    "total": round(sum(t.amount for t in matched), 2),
                })
        return result

    # ------------------------------------------------------------------ #
    #  Cash flow (cumulative over time)
    # ------------------------------------------------------------------ #
    def _cash_flow(self, txs: list[Transaction]) -> list[dict]:
        dates = sorted(set(t.date for t in txs))
        cum_income = 0.0
        cum_expense = 0.0
        result = []
        for d in dates:
            day_txns = [t for t in txs if t.date == d]
            day_income = sum(t.amount for t in day_txns if t.transaction_type == "credit")
            day_expense = sum(t.amount for t in day_txns if t.transaction_type == "debit")
            cum_income += day_income
            cum_expense += day_expense
            result.append({
                "date": d,
                "cumulative_income": round(cum_income, 2),
                "cumulative_expense": round(cum_expense, 2),
                "net_position": round(cum_income - cum_expense, 2),
            })
        return result

    # ------------------------------------------------------------------ #
    #  Predictions
    # ------------------------------------------------------------------ #
    def _predictions(self, txs: list[Transaction]) -> dict:
        expense = [t for t in txs if t.transaction_type == "debit"]
        income = [t for t in txs if t.transaction_type == "credit"]
        now = datetime.now()
        current_month = now.strftime("%Y-%m")
        days_in_month = 30

        # Current month spending so far
        month_expense = [t for t in expense if t.date.startswith(current_month)]
        month_income = [t for t in income if t.date.startswith(current_month)]
        current_spent = sum(t.amount for t in month_expense)
        current_earned = sum(t.amount for t in month_income)

        # Days elapsed in current month
        today = now.day
        days_elapsed = max(1, today)

        # Expected month-end
        if days_elapsed > 0:
            daily_avg_spend = current_spent / days_elapsed
            daily_avg_income = current_earned / days_elapsed
            expected_spending = round(daily_avg_spend * days_in_month, 2)
            expected_savings = round((daily_avg_income - daily_avg_spend) * days_in_month, 2)
        else:
            expected_spending = 0
            expected_savings = 0

        # Budget risk level
        # Look at current month utilization compared to average monthly spending
        monthly_data: dict[str, float] = defaultdict(float)
        for t in expense:
            monthly_data[t.date[:7]] += t.amount
        avg_monthly_spend = sum(monthly_data.values()) / len(monthly_data) if monthly_data else 0

        if avg_monthly_spend > 0:
            projected_ratio = expected_spending / avg_monthly_spend if avg_monthly_spend > 0 else 1
            if projected_ratio > 1.2:
                risk = "High"
            elif projected_ratio > 1.0:
                risk = "Medium"
            else:
                risk = "Low"
        else:
            risk = "Low"

        # Estimated financial health next month (simplified)
        # Base on savings rate trend
        monthly_net: dict[str, float] = {}
        for t in txs:
            key = t.date[:7]
            if key not in monthly_net:
                monthly_net[key] = 0
            if t.transaction_type == "credit":
                monthly_net[key] += t.amount
            else:
                monthly_net[key] -= t.amount

        net_values = list(monthly_net.values())
        if len(net_values) >= 2:
            recent_nets = net_values[-3:]
            avg_net = sum(recent_nets) / len(recent_nets)
            total_income_val = sum(t.amount for t in income)
            total_expense_val = sum(t.amount for t in expense)
            if total_income_val > 0:
                projected_savings_rate = (avg_net / (total_income_val / len(monthly_data.keys()) * 30 / days_in_month) * 100) if total_income_val > 0 else 0
            else:
                projected_savings_rate = 0
            estimated_health = min(100, max(0, int(50 + projected_savings_rate)))
        else:
            estimated_health = 50

        return {
            "expected_month_end_spending": expected_spending,
            "expected_month_end_savings": expected_savings,
            "budget_risk_level": risk,
            "estimated_health_next_month": estimated_health,
        }

    # ------------------------------------------------------------------ #
    #  Calendar heatmap
    # ------------------------------------------------------------------ #
    def _calendar_heatmap(self, txs: list[Transaction]) -> list[dict]:
        day_data: dict[str, dict] = defaultdict(lambda: {"amount": 0.0, "count": 0})
        for t in txs:
            if t.transaction_type == "debit":
                day_data[t.date]["amount"] += t.amount
                day_data[t.date]["count"] += 1
        result = []
        for d in sorted(day_data.keys()):
            result.append({
                "date": d,
                "amount": round(day_data[d]["amount"], 2),
                "transaction_count": day_data[d]["count"],
            })
        return result

    # ------------------------------------------------------------------ #
    #  Empty response
    # ------------------------------------------------------------------ #
    def _empty_response(self) -> dict:
        return {
            "kpis": {
                "total_income": 0, "total_expense": 0, "net_savings": 0,
                "savings_rate": 0, "expense_ratio": 0, "total_transactions": 0,
                "avg_daily_expense": 0, "avg_monthly_expense": 0,
                "highest_spending_day": None, "highest_spending_amount": 0,
                "lowest_spending_day": None, "lowest_spending_amount": 0,
                "volatility_score": 0, "categorized_pct": 0,
                "first_date": None, "last_date": None,
            },
            "monthly_trends": [],
            "weekly_trends": [],
            "daily_trends": [],
            "category_growth": [],
            "merchant_spending": [],
            "subscriptions": [],
            "income_sources": [],
            "spending_distribution": [],
            "cash_flow": [],
            "predictions": {
                "expected_month_end_spending": 0,
                "expected_month_end_savings": 0,
                "budget_risk_level": "Low",
                "estimated_health_next_month": 50,
            },
            "calendar_heatmap": [],
            "filters": {},
        }
