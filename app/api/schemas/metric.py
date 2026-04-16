from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MetricResponse(BaseModel):
    id: UUID
    endpoint_id: UUID
    response_time_ms: float | None
    status_code: int | None
    is_success: bool | None
    error_message: str | None
    checked_at: datetime

    model_config = ConfigDict(from_attributes=True)
