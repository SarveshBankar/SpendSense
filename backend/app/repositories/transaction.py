import uuid

from sqlalchemy.orm import Session

from app.models.transaction import Transaction


class TransactionRepository:
    def list_by_user(
        self, db: Session, user_id: uuid.UUID
    ) -> list[Transaction]:
        return (
            db.query(Transaction)
            .join(Transaction.statement)
            .filter(Transaction.statement.has(user_id=user_id))
            .order_by(Transaction.date.desc(), Transaction.row_index.asc())
            .all()
        )

    def count_by_user(self, db: Session, user_id: uuid.UUID) -> int:
        return (
            db.query(Transaction)
            .join(Transaction.statement)
            .filter(Transaction.statement.has(user_id=user_id))
            .count()
        )

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
