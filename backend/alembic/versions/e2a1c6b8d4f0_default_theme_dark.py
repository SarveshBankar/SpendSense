"""set user_settings theme default to dark

Revision ID: e2a1c6b8d4f0
Revises: c5e7f3a9d2b1
Create Date: 2026-07-31 17:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e2a1c6b8d4f0"
down_revision: Union[str, None] = "c5e7f3a9d2b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("user_settings") as batch_op:
        batch_op.alter_column(
            "theme",
            existing_type=sa.String(16),
            existing_nullable=False,
            server_default="dark",
        )


def downgrade() -> None:
    with op.batch_alter_table("user_settings") as batch_op:
        batch_op.alter_column(
            "theme",
            existing_type=sa.String(16),
            existing_nullable=False,
            server_default="light",
        )
