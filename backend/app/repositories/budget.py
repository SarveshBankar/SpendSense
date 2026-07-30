import uuid

from sqlalchemy.orm import Session

from app.models.budget import Budget


class BudgetRepository:
    def get_by_id(self, db: Session, budget_id: uuid.UUID) -> Budget | None:
        return db.query(Budget).filter(Budget.id == budget_id).first()

    def list_by_user(
        self, db: Session, user_id: uuid.UUID, month: int | None = None, year: int | None = None
    ) -> list[Budget]:
        q = db.query(Budget).filter(Budget.user_id == user_id)
        if month is not None:
            q = q.filter(Budget.month == month)
        if year is not None:
            q = q.filter(Budget.year == year)
        return q.order_by(Budget.created_at.desc()).all()

    def count_by_user(self, db: Session, user_id: uuid.UUID) -> int:
        return db.query(Budget).filter(Budget.user_id == user_id).count()

    def create(self, db: Session, user_id: uuid.UUID, data: dict) -> Budget:
        budget = Budget(user_id=user_id, **data)
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return budget

    def update(self, db: Session, budget: Budget, data: dict) -> Budget:
        for k, v in data.items():
            if v is not None:
                setattr(budget, k, v)
        db.commit()
        db.refresh(budget)
        return budget

    def delete(self, db: Session, budget: Budget) -> None:
        db.delete(budget)
        db.commit()
