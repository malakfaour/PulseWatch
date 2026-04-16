from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field


class EndpointCreate(BaseModel):
    name: str
    url: AnyHttpUrl
    method: Literal["GET", "POST"]
    check_interval: int = Field(ge=1)
    is_active: bool = True


class EndpointUpdate(BaseModel):
    name: str
    url: AnyHttpUrl
    method: Literal["GET", "POST"]
    check_interval: int = Field(ge=1)
    is_active: bool


class EndpointResponse(BaseModel):
    id: UUID
    name: str
    url: str
    method: str
    check_interval: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
