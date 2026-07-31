import uuid
from collections import defaultdict
from datetime import datetime

from sqlalchemy.orm import Session

from app.repositories.anomaly import AnomalyRepository
from app.repositories.transaction import TransactionRepository


class AnomalyScanner:
    def __init__(self, db: Session):
        self.db = db
        self.anomaly_repo = AnomalyRepository()
        self.tx_repo = TransactionRepository()

    def scan(self, user_id: uuid.UUID) -> list[dict]:
        txs = self.tx_repo.list_by_user(self.db, user_id)
        expenses = [t for t in txs if t.transaction_type == "debit"]

        anomalies = []
        if not expenses:
            return anomalies

        cat_amounts: dict[str, list[float]] = defaultdict(list)
        for t in expenses:
            cat_amounts[t.category or "Others"].append(t.amount)

        for t in expenses:
            cat = t.category or "Others"
            amounts = cat_amounts[cat]
            if len(amounts) < 3:
                continue
            avg = sum(amounts) / len(amounts)
            if len(amounts) > 1:
                variance = sum((a - avg) ** 2 for a in amounts) / len(amounts)
                std = variance ** 0.5
            else:
                std = avg * 0.5

            if std > 0 and t.amount > avg + 2.5 * std:
                anomalies.append({
                    "type": "statistical_outlier",
                    "severity": "medium" if t.amount > avg + 3 * std else "low",
                    "description": f"Unusually large {cat} transaction of ₹{t.amount:,.0f} (avg: ₹{avg:,.0f})",
                    "amount": t.amount,
                    "category": cat,
                    "transaction_id": t.id,
                })
            elif t.amount > 100000:
                anomalies.append({
                    "type": "high_value",
                    "severity": "high",
                    "description": f"High-value transaction of ₹{t.amount:,.0f} in {cat}",
                    "amount": t.amount,
                    "category": cat,
                    "transaction_id": t.id,
                })

        unusual_hours = [t for t in expenses if hasattr(t, 'date') and t.date.endswith("T00:00:00") and t.amount > 20000]
        for t in unusual_hours[:5]:
            cat = t.category or "Unknown"
            existing_data = {
                "type": "unusual_timing",
                "severity": "low",
                "description": f"Large transaction of ₹{t.amount:,.0f} in {cat} at {t.date}",
                "amount": t.amount,
                "category": cat,
                "transaction_id": t.id,
            }
            if existing_data not in anomalies:
                anomalies.append(existing_data)

        created = []
        for a in anomalies:
            if not self.anomaly_repo.exists_by_description(self.db, user_id, a["description"]):
                anomaly = self.anomaly_repo.create(
                    self.db, user_id,
                    type=a["type"],
                    severity=a["severity"],
                    description=a["description"],
                    amount=a["amount"],
                    category=a["category"],
                )
                created.append(anomaly)

        return created

    def resolve_all(self, user_id: uuid.UUID) -> int:
        return self.anomaly_repo.resolve_all(self.db, user_id)


def get_anomaly_scanner(db: Session) -> AnomalyScanner:
    return AnomalyScanner(db)
