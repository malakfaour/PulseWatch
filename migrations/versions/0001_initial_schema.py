"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-04-16
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "endpoints",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("method", sa.String(), nullable=True),
        sa.Column("check_interval", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_endpoints_id", "endpoints", ["id"])

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("password", sa.String(), nullable=False),
    )

    op.create_table(
        "alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("endpoint_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("endpoints.id")),
        sa.Column("type", sa.String(length=13), nullable=False),
        sa.Column("comparison", sa.String(), nullable=True),
        sa.Column("threshold", sa.Integer(), nullable=True),
        sa.Column("message", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("triggered_at", sa.DateTime(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_alerts_endpoint_id", "alerts", ["endpoint_id"])

    op.create_table(
        "metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("endpoint_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("endpoints.id")),
        sa.Column("response_time_ms", sa.Float(), nullable=True),
        sa.Column("status_code", sa.Integer(), nullable=True),
        sa.Column("is_success", sa.Boolean(), nullable=True),
        sa.Column("error_message", sa.String(), nullable=True),
        sa.Column("checked_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_metrics_endpoint_id", "metrics", ["endpoint_id"])


def downgrade() -> None:
    op.drop_index("ix_metrics_endpoint_id", table_name="metrics")
    op.drop_table("metrics")
    op.drop_index("ix_alerts_endpoint_id", table_name="alerts")
    op.drop_table("alerts")
    op.drop_table("users")
    op.drop_index("ix_endpoints_id", table_name="endpoints")
    op.drop_table("endpoints")
