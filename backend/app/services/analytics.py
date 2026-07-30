import uuid
from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.repositories.transaction import TransactionRepository


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = TransactionRepository()

    def _get_transactions(self, user_id: uuid.UUID) -> list[Transaction]:
        return self.repo.list_by_user(self.db, user_id)

    # ------------------------------------------------------------------ #
    #  Top-level insight generation
    # ------------------------------------------------------------------ #
    def generate_insights(self, user_id: uuid.UUID) -> dict:
        txs = self._get_transactions(user_id)
        if not txs:
            return self._empty_response()

        stats = self._compute_stats(txs)
        cards = self._build_insight_cards(txs)
        score = self._compute_health_score(stats)
        recommendations = self._generate_recommendations(stats, cards)

        return {
            "financial_score": score,
            "summary": self._build_summary(stats, score),
            "recommendations": recommendations,
            "insights": cards,
            "statistics": stats,
        }

    # ------------------------------------------------------------------ #
    #  Core statistics
    # ------------------------------------------------------------------ #
    def _compute_stats(self, txs: list[Transaction]) -> dict:
        income = [t for t in txs if t.transaction_type == "credit"]
        expense = [t for t in txs if t.transaction_type == "debit"]

        total_income = round(sum(t.amount for t in income), 2)
        total_expense = round(sum(t.amount for t in expense), 2)
        net = round(total_income - total_expense, 2)
        savings_rate = round((net / total_income * 100), 1) if total_income > 0 else 0.0
        expense_ratio = round((total_expense / total_income * 100), 1) if total_income > 0 else 0.0

        categorized = [t for t in txs if t.category]
        cat_pct = round((len(categorized) / len(txs) * 100), 0) if txs else 0

        # Category breakdown (expense only)
        cat_spend: dict[str, float] = defaultdict(float)
        for t in expense:
            cat_spend[t.category or "Others"] += t.amount
        category_breakdown = [
            {"category": k, "amount": round(v, 2)}
            for k, v in sorted(cat_spend.items(), key=lambda x: -x[1])
        ]

        # Top merchants (expense)
        merchant_spend: dict[str, float] = defaultdict(float)
        for t in expense:
            m = t.merchant or "Unknown"
            merchant_spend[m] += t.amount
        top_merchants = [
            {"merchant": k, "amount": round(v, 2)}
            for k, v in sorted(merchant_spend.items(), key=lambda x: -x[1])[:10]
        ]

        # Dates
        dates = sorted(set(t.date for t in txs))
        first_date = dates[0] if dates else None
        last_date = dates[-1] if dates else None

        return {
            "total_transactions": len(txs),
            "total_income": total_income,
            "total_expense": total_expense,
            "net_savings": net,
            "savings_rate": savings_rate,
            "expense_ratio": expense_ratio,
            "categorized_pct": cat_pct,
            "average_transaction": round(sum(t.amount for t in txs) / len(txs), 2) if txs else 0,
            "category_breakdown": category_breakdown,
            "top_merchants": top_merchants,
            "first_date": first_date,
            "last_date": last_date,
        }

    # ------------------------------------------------------------------ #
    #  Insight cards
    # ------------------------------------------------------------------ #
    def _build_insight_cards(self, txs: list[Transaction]) -> list[dict]:
        cards: list[dict] = []

        income = [t for t in txs if t.transaction_type == "credit"]
        expense = [t for t in txs if t.transaction_type == "debit"]
        total_income = sum(t.amount for t in income)
        total_expense = sum(t.amount for t in expense)

        # 1. Highest spending category
        cat_spend: dict[str, float] = defaultdict(float)
        for t in expense:
            cat_spend[t.category or "Others"] += t.amount
        if cat_spend:
            top_cat = max(cat_spend, key=cat_spend.get)
            top_cat_amt = round(cat_spend[top_cat], 2)
            cards.append({
                "type": "highest_category",
                "label": "Highest Spending Category",
                "value": top_cat,
                "detail": f"₹{top_cat_amt:,.0f} total",
                "severity": "info",
            })

        # 2. Largest single expense
        if expense:
            largest = max(expense, key=lambda t: t.amount)
            cards.append({
                "type": "largest_expense",
                "label": "Largest Expense",
                "value": f"₹{largest.amount:,.0f}",
                "detail": largest.description[:80],
                "severity": "warning",
                "date": largest.date,
            })

        # 3. Largest single income
        if income:
            largest = max(income, key=lambda t: t.amount)
            cards.append({
                "type": "largest_income",
                "label": "Largest Income",
                "value": f"₹{largest.amount:,.0f}",
                "detail": largest.description[:80],
                "severity": "success",
                "date": largest.date,
            })

        # 4. Monthly spending trend
        monthly: dict[str, float] = defaultdict(float)
        for t in expense:
            month = t.date[:7]
            monthly[month] += t.amount
        sorted_months = sorted(monthly.items())
        if len(sorted_months) >= 2:
            last_month = sorted_months[-1][1]
            prev_month = sorted_months[-2][1]
            change = ((last_month - prev_month) / prev_month * 100) if prev_month > 0 else 0
            direction = "up" if change > 0 else "down"
            cards.append({
                "type": "monthly_trend",
                "label": "Monthly Spending Trend",
                "value": f"{'↑' if change > 0 else '↓'} {abs(change):.1f}%",
                "detail": f"{'Increase' if change > 0 else 'Decrease'} from previous month",
                "severity": "danger" if change > 5 else "success" if change < -5 else "info",
            })

        # 5. Savings rate
        if total_income > 0:
            rate = round((total_income - total_expense) / total_income * 100, 1)
            cards.append({
                "type": "savings_rate",
                "label": "Savings Rate",
                "value": f"{rate}%",
                "detail": f"You save ₹{(total_income - total_expense):,.0f} of ₹{total_income:,.0f} income",
                "severity": "success" if rate >= 20 else "warning" if rate >= 10 else "danger",
            })

        # 6. Income vs Expense summary
        if total_income > 0 or total_expense > 0:
            ratio = round(total_expense / total_income, 2) if total_income > 0 else float("inf")
            cards.append({
                "type": "income_vs_expense",
                "label": "Income vs Expense",
                "value": f"₹{total_income:,.0f} / ₹{total_expense:,.0f}",
                "detail": f"You spend ₹{ratio:.2f} for every ₹1 earned" if ratio != float("inf") else "No income recorded",
                "severity": "danger" if ratio > 0.9 else "warning" if ratio > 0.7 else "success",
            })

        # 7. Weekend vs Weekday
        weekday_total = 0.0
        weekend_total = 0.0
        for t in expense:
            try:
                dt = datetime.strptime(t.date, "%Y-%m-%d")
                if dt.weekday() >= 5:
                    weekend_total += t.amount
                else:
                    weekday_total += t.amount
            except ValueError:
                pass
        total = weekday_total + weekend_total
        if total > 0:
            wknd_pct = round(weekend_total / total * 100, 1)
            cards.append({
                "type": "weekend_spending",
                "label": "Weekend Spending",
                "value": f"{wknd_pct}%",
                "detail": f"₹{weekend_total:,.0f} of ₹{total:,.0f} spent on weekends",
                "severity": "warning" if wknd_pct > 35 else "info",
            })

        # 8. Suspiciously large transactions (3x+ avg expense)
        if expense:
            avg_expense = sum(t.amount for t in expense) / len(expense)
            suspicious = [t for t in expense if t.amount > 3 * avg_expense]
            if suspicious:
                suspicious.sort(key=lambda t: -t.amount)
                cards.append({
                    "type": "suspicious",
                    "label": "Suspiciously Large Transactions",
                    "value": f"{len(suspicious)} found",
                    "detail": f"Top: ₹{suspicious[0].amount:,.0f} — {suspicious[0].description[:60]}",
                    "severity": "danger",
                })

        # 9. Recurring subscriptions (same merchant, similar amount, 3+ occurrences)
        merchant_counts: dict[str, list[float]] = defaultdict(list)
        for t in expense:
            m = t.merchant or t.description.strip().lower()
            merchant_counts[m].append(t.amount)
        subscriptions = []
        for merchant, amounts in merchant_counts.items():
            if len(amounts) >= 3:
                avg = sum(amounts) / len(amounts)
                # Check amounts are within 30% of average (regular recurring)
                if all(abs(a - avg) / avg <= 0.3 for a in amounts):
                    subscriptions.append({
                        "merchant": merchant if merchant != t.description.strip().lower() else t.description[:40],
                        "average_amount": round(avg, 2),
                        "occurrences": len(amounts),
                    })
        if subscriptions:
            subscriptions.sort(key=lambda x: -x["occurrences"])
            total_sub_cost = round(sum(s["average_amount"] for s in subscriptions), 2)
            cards.append({
                "type": "subscriptions",
                "label": "Recurring Subscriptions",
                "value": f"{len(subscriptions)} found",
                "detail": f"~₹{total_sub_cost:,.0f}/month total",
                "severity": "info",
                "subscriptions": subscriptions[:5],
            })

        # 10. Month-over-month category comparison
        if len(cat_spend) > 0 and len(sorted_months) >= 2:
            current_month = sorted_months[-1][0]
            prev_month_dt = datetime.strptime(sorted_months[-1][0] + "-01", "%Y-%m-%d") - timedelta(days=1)
            prev_month = prev_month_dt.strftime("%Y-%m")
            current_cats: dict[str, float] = defaultdict(float)
            prev_cats: dict[str, float] = defaultdict(float)
            for t in expense:
                if t.date.startswith(current_month):
                    current_cats[t.category or "Others"] += t.amount
                elif t.date.startswith(prev_month):
                    prev_cats[t.category or "Others"] += t.amount
            changed_cats = []
            for cat in set(list(current_cats.keys()) + list(prev_cats.keys())):
                cur = current_cats.get(cat, 0)
                prev = prev_cats.get(cat, 0)
                if prev > 0 and cur > 0:
                    chg = round((cur - prev) / prev * 100, 1)
                    if abs(chg) > 10:
                        changed_cats.append({"category": cat, "change_pct": chg, "direction": "up" if chg > 0 else "down"})
            if changed_cats:
                changed_cats.sort(key=lambda x: -abs(x["change_pct"]))
                cards.append({
                    "type": "category_comparison",
                    "label": "Category Changes",
                    "value": f"{len(changed_cats)} categories changed >10%",
                    "detail": f"Biggest: {changed_cats[0]['category']} ({changed_cats[0]['change_pct']:+.1f}%)",
                    "severity": "warning",
                    "changes": changed_cats[:3],
                })

        # 11. Top 10 merchants
        if top_merchants := self._compute_stats(txs).get("top_merchants", []):
            top_merchant_name = top_merchants[0]["merchant"]
            top_merchant_amt = top_merchants[0]["amount"]
            cards.append({
                "type": "top_merchant",
                "label": "Top Merchant",
                "value": top_merchant_name,
                "detail": f"₹{top_merchant_amt:,.0f} total spent",
                "severity": "info",
            })

        return cards

    # ------------------------------------------------------------------ #
    #  Financial Health Score (0–100)
    # ------------------------------------------------------------------ #
    def _compute_health_score(self, stats: dict) -> dict:
        score = 50  # baseline

        # Savings rate (up to 30 points)
        sr = stats.get("savings_rate", 0)
        if sr >= 30:
            score += 30
        elif sr >= 20:
            score += 25
        elif sr >= 10:
            score += 15
        elif sr >= 5:
            score += 8
        else:
            score -= 5

        # Expense ratio (up to 20 points)
        er = stats.get("expense_ratio", 100)
        if er <= 50:
            score += 20
        elif er <= 70:
            score += 15
        elif er <= 85:
            score += 8
        elif er <= 100:
            score += 0
        else:
            score -= 10

        # Categorization (up to 15 points)
        cp = stats.get("categorized_pct", 0)
        score += min(15, int(cp / 100 * 15))

        # Transaction volume (up to 10 points)
        count = stats.get("total_transactions", 0)
        if count >= 100:
            score += 10
        elif count >= 50:
            score += 7
        elif count >= 20:
            score += 4
        elif count >= 10:
            score += 2

        # Income stability (up to 10 points)
        income = stats.get("total_income", 0)
        expense = stats.get("total_expense", 0)
        if income > expense:
            score += 10
        elif income > expense * 0.8:
            score += 5

        # Subscriptions penalty (up to -5 points)
        # Detected via insight cards — we estimate from data
        # Missing data, skip penalty for now

        score = max(0, min(100, score))

        return {
            "score": score,
            "savings_rate_score": min(30, max(0, sr * 1.0)),
            "expense_ratio_score": min(20, max(0, 20 - max(0, er - 50) * 0.4)),
            "categorization_score": min(15, int(cp / 100 * 15)),
            "volume_score": min(10, count / 10),
            "stability_score": min(10, 10 if income > expense else 5 if income > expense * 0.8 else 0),
            "breakdown": {
                "savings_rate": sr,
                "expense_ratio": er,
                "categorized_pct": cp,
                "total_transactions": count,
            },
        }

    # ------------------------------------------------------------------ #
    #  Recommendations
    # ------------------------------------------------------------------ #
    def _generate_recommendations(self, stats: dict, cards: list[dict]) -> list[dict]:
        recs: list[dict] = []

        sr = stats.get("savings_rate", 0)
        er = stats.get("expense_ratio", 0)
        income = stats.get("total_income", 0)
        expense = stats.get("total_expense", 0)

        if sr < 10:
            recs.append({
                "type": "savings",
                "title": "Increase your savings rate",
                "description": f"Your savings rate is only {sr}%. Aim for at least 20% by reducing non-essential spending.",
                "priority": "high",
            })
        elif sr < 20:
            recs.append({
                "type": "savings",
                "title": "Good savings rate, can improve",
                "description": f"Your savings rate of {sr}% is decent. Try cutting discretionary expenses to reach 20%+.",
                "priority": "medium",
            })

        if er > 90:
            recs.append({
                "type": "spending",
                "title": "Reduce expense ratio",
                "description": f"You're spending {er}% of your income. Consider creating a budget to keep expenses below 80%.",
                "priority": "high",
            })
        elif er > 75:
            recs.append({
                "type": "spending",
                "title": "Monitor your spending",
                "description": f"Your expense ratio of {er}% is moderate. Track discretionary categories to maintain control.",
                "priority": "medium",
            })

        cp = stats.get("categorized_pct", 0)
        if cp < 80:
            recs.append({
                "type": "categorization",
                "title": "Categorize your transactions",
                "description": f"Only {cp:.0f}% of transactions are categorized. Run categorization to get better insights.",
                "priority": "medium",
            })

        if stats.get("total_transactions", 0) < 10:
            recs.append({
                "type": "data",
                "title": "Upload more statements",
                "description": "You have fewer than 10 transactions. Upload more bank statements for meaningful analysis.",
                "priority": "low",
            })

        if income == 0:
            recs.append({
                "type": "income",
                "title": "No income detected",
                "description": "No income transactions found. Add statements with credit entries for a complete picture.",
                "priority": "medium",
            })

        return recs

    # ------------------------------------------------------------------ #
    #  Summary
    # ------------------------------------------------------------------ #
    def _build_summary(self, stats: dict, score: dict) -> str:
        sr = stats.get("savings_rate", 0)
        score_val = score.get("score", 50)
        total_income = stats.get("total_income", 0)
        total_expense = stats.get("total_expense", 0)

        if total_income == 0 and total_expense == 0:
            return "No financial data available. Upload statements to get started."

        if score_val >= 80:
            summary = f"Excellent financial health! "
        elif score_val >= 60:
            summary = f"Good financial health with room to grow. "
        elif score_val >= 40:
            summary = f"Fair financial health — some areas need attention. "
        else:
            summary = f"Your finances need significant improvement. "

        summary += f"Your savings rate is {sr}% with ₹{total_income:,.0f} income and ₹{total_expense:,.0f} in expenses. "
        summary += f"{'Keep up the good work!' if sr >= 20 else 'Focus on increasing your savings.'}"

        return summary

    # ------------------------------------------------------------------ #
    #  Empty response
    # ------------------------------------------------------------------ #
    def _empty_response(self) -> dict:
        return {
            "financial_score": {
                "score": 0,
                "savings_rate_score": 0,
                "expense_ratio_score": 0,
                "categorization_score": 0,
                "volume_score": 0,
                "stability_score": 0,
                "breakdown": {
                    "savings_rate": 0,
                    "expense_ratio": 0,
                    "categorized_pct": 0,
                    "total_transactions": 0,
                },
            },
            "summary": "No transactions found. Upload and parse a bank statement to see insights.",
            "recommendations": [
                {
                    "type": "data",
                    "title": "Upload your first statement",
                    "description": "Get started by uploading a PDF or CSV bank statement to generate financial insights.",
                    "priority": "high",
                }
            ],
            "insights": [],
            "statistics": {
                "total_transactions": 0,
                "total_income": 0,
                "total_expense": 0,
                "net_savings": 0,
                "savings_rate": 0,
                "expense_ratio": 0,
                "categorized_pct": 0,
                "average_transaction": 0,
                "category_breakdown": [],
                "top_merchants": [],
                "first_date": None,
                "last_date": None,
            },
        }
