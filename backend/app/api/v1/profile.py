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


@router.get("", response_model=ProfileResponse, summary="Get user profile")
def get_profile(
    current_user: User = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
):
    return service.get_profile(current_user)


@router.put("", response_model=ProfileUpdateResponse, summary="Update profile")
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
):
    return service.update_profile(current_user, data)


@router.put("/password", response_model=ChangePasswordResponse, summary="Change password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
):
    return service.change_password(current_user, data)
