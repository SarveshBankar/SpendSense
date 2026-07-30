from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.repositories.transaction import TransactionRepository
from app.schemas.transaction import CategorizationSummaryResponse, CategoryCount
from app.services.categorizer.engine import categorize_transaction


class CategorizationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = TransactionRepository()

    def categorize_all(
        self, current_user: User
    ) -> CategorizationSummaryResponse:
        transactions = self.repo.list_by_user(self.db, current_user.id)

        categorized = 0
        uncategorized = 0
        cat_counts: dict[str, int] = {}

        for tx in transactions:
            result = categorize_transaction(
                description=tx.description,
                merchant=tx.merchant,
                payment_mode=tx.payment_mode,
            )

            tx.category = result.category
            tx.confidence_score = result.confidence_score
            tx.matched_rule = result.matched_rule

            if result.category != "Others" or result.confidence_score >= 70:
                categorized += 1
            else:
                uncategorized += 1

            cat_counts[result.category] = (
                cat_counts.get(result.category, 0) + 1
            )

        self.db.commit()

        category_wise = [
            CategoryCount(category=cat, count=cnt)
            for cat, cnt in sorted(
                cat_counts.items(), key=lambda x: x[1], reverse=True
            )
        ]

        return CategorizationSummaryResponse(
            total_transactions=len(transactions),
            categorized=categorized,
            uncategorized=uncategorized,
            category_wise=category_wise,
        )


def get_categorization_service(
    db: Session = Depends(get_db),
) -> CategorizationService:
    return CategorizationService(db)
