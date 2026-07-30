import re
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("full_name")
    @classmethod
    def full_name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("full_name must not be empty")
        return v.strip()

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError(
                "password must contain at least one uppercase letter"
            )
        if not re.search(r"[a-z]", v):
            raise ValueError(
                "password must contain at least one lowercase letter"
            )
        if not re.search(r"\d", v):
            raise ValueError("password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+]", v):
            raise ValueError(
                "password must contain at least one special character"
            )
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
