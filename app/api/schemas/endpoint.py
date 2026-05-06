from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import AnyHttpUrl, ConfigDict, Field

from app.api.schemas import CamelModel


class EndpointCreate(CamelModel):
    name: str
    url: AnyHttpUrl
    method: Literal["GET", "POST"]
    check_interval: int = Field(ge=1)
    is_active: bool = True


class EndpointUpdate(CamelModel):
    name: str
    url: AnyHttpUrl
    method: Literal["GET", "POST"]
    check_interval: int = Field(ge=1)
    is_active: bool


class EndpointResponse(CamelModel):
    id: UUID
    name: str
    url: str
    method: str
    check_interval: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EndpointPageResponse(CamelModel):
    items: list[EndpointResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
