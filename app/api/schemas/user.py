from uuid import UUID

from pydantic import Field

from app.api.schemas import CamelModel


class UserRegister(CamelModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str


class UserLogin(CamelModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str


class UserResponse(CamelModel):
    id: UUID
    email: str

    model_config = {"from_attributes": True}


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
