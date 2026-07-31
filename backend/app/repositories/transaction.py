import uuid

from sqlalchemy import desc, asc
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


class TransactionRepository:
    def _normalize_dates(
        self,
        from_date: str | None,
        to_date: str | None,
    ) -> tuple[str | None, str | None]:
        if from_date and to_date and from_date > to_date:
            return to_date, from_date
        return from_date, to_date

    def list_by_user(
        self, db: Session, user_id: uuid.UUID,
        skip: int = 0, limit: int = 100,
        sort_by: str = "date",
        sort_order: str = "desc",
        search: str | None = None,
        transaction_type: str | None = None,
        category: str | None = None,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> list[Transaction]:
        from_date, to_date = self._normalize_dates(from_date, to_date)
        q = (
            db.query(Transaction)
            .join(Transaction.statement)
            .filter(Transaction.statement.has(user_id=user_id))
        )

        if search:
            q = q.filter(Transaction.description.ilike(f"%{search}%"))
        if transaction_type:
            q = q.filter(Transaction.transaction_type == transaction_type)
        if category:
            q = q.filter(Transaction.category == category)
        if from_date:
            q = q.filter(Transaction.date >= from_date)
        if to_date:
            q = q.filter(Transaction.date <= to_date)

        sort_col = getattr(Transaction, sort_by, Transaction.date)
        order_fn = desc if sort_order == "desc" else asc
        q = q.order_by(order_fn(sort_col), Transaction.row_index.asc())

        return q.offset(skip).limit(limit).all()

    def count_by_user(
        self, db: Session, user_id: uuid.UUID,
        search: str | None = None,
        transaction_type: str | None = None,
        category: str | None = None,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> int:
        from_date, to_date = self._normalize_dates(from_date, to_date)
        q = (
            db.query(Transaction)
            .join(Transaction.statement)
            .filter(Transaction.statement.has(user_id=user_id))
        )

        if search:
            q = q.filter(Transaction.description.ilike(f"%{search}%"))
        if transaction_type:
            q = q.filter(Transaction.transaction_type == transaction_type)
        if category:
            q = q.filter(Transaction.category == category)
        if from_date:
            q = q.filter(Transaction.date >= from_date)
        if to_date:
            q = q.filter(Transaction.date <= to_date)

        return q.count()

    def list_by_statement(
        self, db: Session, statement_id: uuid.UUID
    ) -> list[Transaction]:
        return (
            db.query(Transaction)
            .filter(Transaction.statement_id == statement_id)
            .order_by(Transaction.row_index.asc())
            .all()
        )

    def bulk_create(
        self, db: Session, transactions: list[Transaction]
    ) -> list[Transaction]:
        db.add_all(transactions)
        db.commit()
        for t in transactions:
            db.refresh(t)
        return transactions

    def delete_by_statement(
        self, db: Session, statement_id: uuid.UUID
    ) -> None:
        db.query(Transaction).filter(
            Transaction.statement_id == statement_id
        ).delete()
        db.commit()
