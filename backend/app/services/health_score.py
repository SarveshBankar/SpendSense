import uuid
from collections import defaultdict

from sqlalchemy.orm import Session

from app.repositories.transaction import TransactionRepository


class HealthScoreGrader:
    def __init__(self, db: Session):
        self.db = db
        self.tx_repo = TransactionRepository()

    def grade(self, user_id: uuid.UUID) -> dict:
        txs = self.tx_repo.list_by_user(self.db, user_id)
        expenses = [t for t in txs if t.transaction_type == "debit"]
        income_txns = [t for t in txs if t.transaction_type == "credit"]

        total_income = sum(t.amount for t in income_txns)
        total_expense = sum(t.amount for t in expenses)

        savings_rate = ((total_income - total_expense) / total_income * 100) if total_income > 0 else 0
        expense_ratio = (total_expense / total_income * 100) if total_income > 0 else 0

        cat_spend: dict[str, float] = defaultdict(float)
        for t in expenses:
            cat_spend[t.category or "Others"] += t.amount
        categorized_pct = (sum(v for k, v in cat_spend.items() if k != "Others") / total_expense * 100) if total_expense > 0 else 0

        score = 50
        breakdown = {}

        if savings_rate >= 20:
            score += 20
            breakdown["savings_rate"] = 20
        elif savings_rate >= 10:
            score += 10
            breakdown["savings_rate"] = 10
        elif savings_rate >= 0:
            score += 0
            breakdown["savings_rate"] = 0
        else:
            score -= 20
            breakdown["savings_rate"] = -20

        if expense_ratio <= 50:
            score += 15
            breakdown["expense_ratio"] = 15
        elif expense_ratio <= 80:
            score += 5
            breakdown["expense_ratio"] = 5
        elif expense_ratio <= 100:
            score += 0
            breakdown["expense_ratio"] = 0
        else:
            score -= 15
            breakdown["expense_ratio"] = -15

        if categorized_pct >= 80:
            score += 10
            breakdown["categorized"] = 10
        elif categorized_pct >= 50:
            score += 5
            breakdown["categorized"] = 5
        else:
            breakdown["categorized"] = 0

        num_cats = len([k for k in cat_spend if k != "Others"])
        if num_cats >= 5:
            score += 10
            breakdown["diversity"] = 10
        elif num_cats >= 3:
            score += 5
            breakdown["diversity"] = 5
        else:
            breakdown["diversity"] = 0

        if total_income > 0 and total_expense > 0:
            stability = abs(expense_ratio - 50)
            if stability <= 10:
                score += 5
                breakdown["stability"] = 5
            else:
                breakdown["stability"] = 0
        else:
            breakdown["stability"] = 0

        has_uncategorized = any(t.category in (None, "Others") for t in expenses)
        if not has_uncategorized:
            score += 5
            breakdown["completeness"] = 5
        else:
            breakdown["completeness"] = 0

        score = max(0, min(100, score))

        if score >= 80: grade, grade_label = "A", "Excellent"
        elif score >= 65: grade, grade_label = "B", "Good"
        elif score >= 50: grade, grade_label = "C", "Fair"
        elif score >= 35: grade, grade_label = "D", "Needs Work"
        else: grade, grade_label = "F", "Critical"

        suggestions = []
        if savings_rate < 20:
            suggestions.append("Increase savings rate to at least 20% of income")
        if expense_ratio > 80:
            suggestions.append("Reduce expenses to stay within 80% of income")
        if categorized_pct < 80:
            suggestions.append(f"Add categories for the {100 - categorized_pct:.0f}% uncategorized transactions")
        if num_cats < 3:
            suggestions.append("Use more categories for better tracking")
        has_budget = any(tx.description and "budget" in tx.description.lower() for tx in txs)
        if not has_budget:
            suggestions.append("Set category budgets to control spending")

        return {
            "score": score,
            "grade": grade,
            "grade_label": grade_label,
            "breakdown": breakdown,
            "explanation": (
                f"Your savings rate is {savings_rate:.1f}% with an expense ratio of {expense_ratio:.1f}%. "
                f"You have {num_cats} spending categories, "
                f"{categorized_pct:.0f}% of which are categorized."
            ),
            "suggestions": suggestions,
        }


def get_health_score_grader(db: Session) -> HealthScoreGrader:
    return HealthScoreGrader(db)
