"""add_password_protected_to_statements

Revision ID: ac9e4e1832cb
Revises: 9b83f1a4c2d7
Create Date: 2026-07-31 14:10:53.216688

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac9e4e1832cb'
down_revision: Union[str, None] = '9b83f1a4c2d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'statements',
        sa.Column(
            'password_protected',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column('statements', 'password_protected')
