import uuid

from sqlalchemy.orm import Session

from app.models.statement import Statement


class StatementRepository:
    def get_by_id(self, db: Session, statement_id: uuid.UUID) -> Statement | None:
        return db.query(Statement).filter(Statement.id == statement_id).first()

    def list_by_user(
        self, db: Session, user_id: uuid.UUID
    ) -> list[Statement]:
        return (
            db.query(Statement)
            .filter(Statement.user_id == user_id)
            .order_by(Statement.uploaded_at.desc())
            .all()
        )

    def count_by_user(self, db: Session, user_id: uuid.UUID) -> int:
        return (
            db.query(Statement)
            .filter(Statement.user_id == user_id)
            .count()
        )

    def count_by_original_name(
        self, db: Session, user_id: uuid.UUID, original_name: str
    ) -> int:
        return (
            db.query(Statement)
            .filter(
                Statement.user_id == user_id,
                Statement.original_file_name == original_name,
            )
            .count()
        )

    def create(
        self,
        db: Session,
        user_id: uuid.UUID,
        original_file_name: str,
        stored_file_name: str,
        file_type: str,
        file_size: int,
    ) -> Statement:
        statement = Statement(
            user_id=user_id,
            original_file_name=original_file_name,
            stored_file_name=stored_file_name,
            file_type=file_type,
            file_size=file_size,
            status="uploaded",
        )
        db.add(statement)
        db.commit()
        db.refresh(statement)
        return statement

    def delete(self, db: Session, statement: Statement) -> None:
        db.delete(statement)
        db.commit()
