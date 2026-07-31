import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Uuid, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Statement(Base):
    __tablename__ = "statements"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    original_file_name: Mapped[str] = mapped_column(
        String(512), nullable=False
    )
    stored_file_name: Mapped[str] = mapped_column(
        String(512), nullable=False
    )
    file_type: Mapped[str] = mapped_column(
        String(10), nullable=False
    )
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="uploaded"
    )
    password_protected: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("ix_statements_user_uploaded", "user_id", "uploaded_at"),
        Index("ix_statements_user_filename", "user_id", "original_file_name"),
    )
