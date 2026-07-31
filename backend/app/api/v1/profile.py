from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.profile import (
    ProfileResponse,
    ProfileUpdate,
    ProfileUpdateResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
)
from app.services.profile import ProfileService

router = APIRouter(prefix="/profile", tags=["profile"])


def _get_service(db: Session = Depends(get_db)) -> ProfileService:
    return ProfileService(db)


@router.get(
    "",
    response_model=ProfileResponse,
    summary="Get user profile",
    description="Returns the current user's profile including personal details and "
    "account statistics (total transactions, statements, budgets, goals).",
    responses={
        200: {"description": "Profile retrieved"},
        401: {"description": "Authentication required"},
    },
)
def get_profile(
    current_user: User = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
):
    return service.get_profile(current_user)


@router.put(
    "",
    response_model=ProfileUpdateResponse,
    summary="Update profile",
    description="Updates the user's full name and/or email. Email uniqueness is validated. "
    "Returns the updated user profile.",
    responses={
        200: {"description": "Profile updated"},
        400: {"description": "Email already in use"},
        401: {"description": "Authentication required"},
    },
)
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
):
    return service.update_profile(current_user, data)


@router.put(
    "/password",
    response_model=ChangePasswordResponse,
    summary="Change password",
    description="Changes the user's password. Requires the current password for verification. "
    "New password must meet strength requirements (8+ chars, uppercase, lowercase, digit, special).",
    responses={
        200: {"description": "Password changed"},
        400: {"description": "Current password is incorrect or new password is too weak"},
        401: {"description": "Authentication required"},
    },
)
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
):
    return service.change_password(current_user, data)
