import uuid
from collections import defaultdict

from sqlalchemy.orm import Session

from app.repositories.transaction import TransactionRepository


class PredictionService:
    def __init__(self, db: Session):
        self.db = db
        self.tx_repo = TransactionRepository()

    def predict_next_month(self, user_id: uuid.UUID) -> dict:
        txs = self.tx_repo.list_by_user(self.db, user_id)

        months = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
        for t in txs:
            month = t.date[:7]
            if t.transaction_type == "credit":
                months[month]["income"] += t.amount
            else:
                months[month]["expense"] += t.amount

        if len(months) < 1:
            return {
                "predicted_expense": 0,
                "predicted_income": 0,
                "predicted_savings": 0,
                "prediction_confidence": "None",
                "budget_risk": "Low",
                "category_predictions": [],
                "next_month": "",
            }

        sorted_m = sorted(months.items())
        expense_vals = [v["expense"] for _, v in sorted_m]
        income_vals = [v["income"] for _, v in sorted_m]

        avg_expense = sum(expense_vals) / len(expense_vals)
        avg_income = sum(income_vals) / len(income_vals)

        if len(expense_vals) >= 3:
            recent_3 = expense_vals[-3:]
            trend = (recent_3[-1] - recent_3[0]) / recent_3[0] * 100 if recent_3[0] > 0 else 0
        else:
            trend = 0

        predicted_expense = avg_expense * (1 + trend / 100 * 0.5)
        predicted_income = avg_income * (1 + 0.02)
        predicted_savings = predicted_income - predicted_expense

        if len(months) >= 4: confidence = "High"
        elif len(months) >= 2: confidence = "Medium"
        else: confidence = "Low"

        budget_risk = "Low" if predicted_savings > predicted_income * 0.1 else "Medium" if predicted_savings > 0 else "High"

        cat_expenses: dict[str, list[float]] = defaultdict(list)
        for t in txs:
            if t.transaction_type == "debit":
                cat_expenses[t.category or "Others"].append(t.amount)
        category_predictions = []
        for cat, amounts in sorted(cat_expenses.items(), key=lambda x: -sum(x[1])):
            avg_cat = sum(amounts) / len(amounts)
            cat_trend = 0
            if len(amounts) >= 3:
                cat_trend = (amounts[-1] - amounts[0]) / amounts[0] * 100 if amounts[0] > 0 else 0
            category_predictions.append({
                "category": cat,
                "predicted": round(avg_cat * (1 + cat_trend / 100 * 0.3), 2),
                "avg_monthly": round(avg_cat, 2),
            })

        last_key = sorted_m[-1][0]
        y, m = last_key.split("-")
        next_m = int(m) + 1
        next_y = int(y)
        if next_m > 12:
            next_m = 1
            next_y += 1
        next_label = f"{next_y:04d}-{next_m:02d}"

        return {
            "predicted_expense": round(predicted_expense, 2),
            "predicted_income": round(predicted_income, 2),
            "predicted_savings": round(predicted_savings, 2),
            "prediction_confidence": confidence,
            "budget_risk": budget_risk,
            "category_predictions": category_predictions[:6],
            "next_month": next_label,
        }


def get_prediction_service(db: Session) -> PredictionService:
    return PredictionService(db)
