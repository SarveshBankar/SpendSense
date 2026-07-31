import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Text, Uuid, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.statement import Statement


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    statement_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("statements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date: Mapped[str] = mapped_column(String(16), nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    balance: Mapped[float | None] = mapped_column(Float, nullable=True)
    transaction_type: Mapped[str] = mapped_column(
        String(8), nullable=False
    )
    merchant: Mapped[str | None] = mapped_column(String(255), nullable=True)
    payment_mode: Mapped[str | None] = mapped_column(
        String(32), nullable=True
    )
    reference_number: Mapped[str | None] = mapped_column(
        String(128), nullable=True
    )
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    row_index: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str | None] = mapped_column(
        String(64), nullable=True, default=None
    )
    confidence_score: Mapped[int | None] = mapped_column(
        Integer, nullable=True, default=None
    )
    matched_rule: Mapped[str | None] = mapped_column(
        String(128), nullable=True, default=None
    )

    statement: Mapped["Statement"] = relationship(backref="transactions")

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("ix_transactions_date", "date"),
        Index("ix_transactions_type", "transaction_type"),
        Index("ix_transactions_category", "category"),
        Index("ix_transactions_stmt_row", "statement_id", "row_index"),
    )
