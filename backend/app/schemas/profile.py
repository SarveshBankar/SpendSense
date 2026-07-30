import uuid

from pydantic import BaseModel, EmailStr


class ProfileResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    is_active: bool
    created_at: str
    updated_at: str
    profile_picture: str | None = None
    total_transactions: int = 0
    total_statements: int = 0
    total_budgets: int = 0
    total_goals: int = 0

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


class ProfileUpdateResponse(BaseModel):
    message: str
    user: ProfileResponse


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ChangePasswordResponse(BaseModel):
    message: str
