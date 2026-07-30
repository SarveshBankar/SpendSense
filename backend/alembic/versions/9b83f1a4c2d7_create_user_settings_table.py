"""create user_settings table

Revision ID: 9b83f1a4c2d7
Revises: c9a00ab4c29b
Create Date: 2026-07-30 14:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9b83f1a4c2d7"
down_revision: Union[str, None] = "c9a00ab4c29b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_settings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("currency", sa.String(8), nullable=False, server_default="INR"),
        sa.Column("language", sa.String(8), nullable=False, server_default="en"),
        sa.Column("theme", sa.String(16), nullable=False, server_default="light"),
        sa.Column("date_format", sa.String(16), nullable=False, server_default="YYYY-MM-DD"),
        sa.Column("email_notifications", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("push_notifications", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("weekly_report", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_user_settings_user_id"), "user_settings", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_user_settings_user_id"), table_name="user_settings")
    op.drop_table("user_settings")
