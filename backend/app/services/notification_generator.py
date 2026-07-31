import uuid
from datetime import datetime, timedelta
from collections import defaultdict

from sqlalchemy.orm import Session

from app.repositories.notification import NotificationRepository
from app.repositories.transaction import TransactionRepository
from app.repositories.budget import BudgetRepository


class NotificationGenerator:
    def __init__(self, db: Session):
        self.db = db
        self.notif_repo = NotificationRepository()
        self.tx_repo = TransactionRepository()
        self.budget_repo = BudgetRepository()

    def generate(self, user_id: uuid.UUID) -> int:
        created = 0
        now = datetime.utcnow()
        first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        txs = self.tx_repo.list_by_user(self.db, user_id)
        expenses = [t for t in txs if t.transaction_type == "debit"]

        cat_spend: dict[str, float] = defaultdict(float)
        for t in expenses:
            cat_spend[t.category or "Others"] += t.amount

        budgets = self.budget_repo.list_by_user(self.db, user_id)
        for budget in budgets:
            cat = budget.category
            spent = cat_spend.get(cat or "", 0)
            pct = (spent / budget.monthly_budget * 100) if budget.monthly_budget > 0 else 0

            if pct > 100:
                self.notif_repo.create(
                    self.db, user_id,
                    type="budget_exceeded",
                    title=f"Budget exceeded: {cat or 'Overall'}",
                    message=f"You've spent ₹{spent:,.0f} out of ₹{budget.monthly_budget:,.0f} ({pct:.0f}%) in {cat or 'Overall'}.",
                    severity="high",
                    metadata_json={"category": cat, "spent": spent, "budget": budget.monthly_budget, "pct": pct},
                )
                created += 1
            elif pct >= 90:
                self.notif_repo.create(
                    self.db, user_id,
                    type="budget_warning",
                    title=f"Budget nearly full: {cat or 'Overall'}",
                    message=f"You've used {pct:.0f}% of your {cat or 'Overall'} budget (₹{spent:,.0f} / ₹{budget.monthly_budget:,.0f}).",
                    severity="medium",
                    metadata_json={"category": cat, "spent": spent, "budget": budget.monthly_budget, "pct": pct},
                )
                created += 1

        total_expense = sum(t.amount for t in expenses)
        total_income = sum(t.amount for t in txs if t.transaction_type == "credit")
        if total_income > 0:
            savings_rate = (total_income - total_expense) / total_income * 100
            if savings_rate < 0:
                self.notif_repo.create(
                    self.db, user_id,
                    type="negative_savings",
                    title="Spending exceeds income",
                    message=f"Your expenses (₹{total_expense:,.0f}) exceeded income (₹{total_income:,.0f}) this month. Consider reducing spending.",
                    severity="high",
                    metadata_json={"income": total_income, "expense": total_expense, "savings_rate": savings_rate},
                )
                created += 1

        high_value = [t for t in expenses if t.amount > 50000]
        if high_value:
            self.notif_repo.create(
                self.db, user_id,
                type="large_transaction",
                title=f"Large transaction detected: ₹{high_value[0].amount:,.0f}",
                message=f"A transaction of ₹{high_value[0].amount:,.0f} was found in {high_value[0].category or 'Unknown'}.",
                severity="medium",
                metadata_json={"amount": high_value[0].amount, "description": high_value[0].description, "category": high_value[0].category},
            )
            created += 1

        score = self._compute_health_score(total_income, total_expense, cat_spend)
        if score < 50:
            self.notif_repo.create(
                self.db, user_id,
                type="health_alert",
                title="Financial health needs attention",
                message=f"Your financial health score is {score}/100. Review your spending habits.",
                severity="medium",
                metadata_json={"score": score},
            )
            created += 1

        return created

    def _compute_health_score(self, income: float, expense: float, cat_spend: dict) -> int:
        score = 60
        if income > 0:
            rate = (income - expense) / income * 100
            if rate >= 20: score += 20
            elif rate >= 10: score += 10
            else: score -= 10
        if len(cat_spend) >= 4: score += 10
        elif len(cat_spend) >= 2: score += 5
        if expense > 0 and income > expense * 1.5: score += 10
        elif expense > income: score -= 20
        return max(0, min(100, score))

    def cleanup_old(self, user_id: uuid.UUID, days: int = 30) -> int:
        cutoff = datetime.utcnow() - timedelta(days=days)
        count = self.notif_repo.delete_old(self.db, user_id, cutoff)
        return count


def get_notification_service(db: Session) -> NotificationGenerator:
    return NotificationGenerator(db)
