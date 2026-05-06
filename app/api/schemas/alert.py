from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import ConfigDict, Field

from app.api.schemas import CamelModel

AlertTypeValue = Literal["RESPONSE_TIME", "STATUS_CODE", "DOWNTIME"]
AlertComparisonValue = Literal[">", "<", "=="]


class AlertCreate(CamelModel):
    endpoint_id: UUID
    type: AlertTypeValue
    comparison: AlertComparisonValue
    threshold: int = Field(ge=0)
    message: str | None = None
    is_active: bool = True


class AlertUpdate(CamelModel):
    type: AlertTypeValue | None = None
    comparison: AlertComparisonValue | None = None
    threshold: int | None = Field(default=None, ge=0)
    message: str | None = None
    is_active: bool | None = None


class AlertResponse(CamelModel):
    id: UUID
    endpoint_id: UUID
    type: AlertTypeValue
    comparison: AlertComparisonValue
    threshold: int
    message: str | None
    is_active: bool
    triggered_at: datetime
    resolved_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
