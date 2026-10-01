"""Add servers table

Revision ID: e61492aaa906
Revises: 19a8b91efacc
Create Date: 2025-09-10 05:39:03.230513

"""

import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from arservercontroller.constants import SERVER_SCHEMA_VERSION

# revision identifiers, used by Alembic.
revision: str = "e61492aaa906"
down_revision: Union[str, Sequence[str], None] = "19a8b91efacc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "servers",
        sa.Column(
            "id",
            sa.UUID,
            primary_key=True,
            unique=True,
            index=True,
            nullable=False,
            default=uuid.uuid4,
        ),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("version", sa.String, nullable=False, default=SERVER_SCHEMA_VERSION),
        sa.Column("created_at", sa.Integer),
        sa.Column("updated_at", sa.Integer),
        sa.Column("data", sa.JSON, nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_servers_id"), table_name="servers")
    op.drop_table(op.f("servers"))
