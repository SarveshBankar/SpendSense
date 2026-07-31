from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.settings import SettingsResponse, SettingsUpdate, SettingsUpdateResponse
from app.services.settings import SettingsService

router = APIRouter(prefix="/settings", tags=["settings"])


def _get_service(db: Session = Depends(get_db)) -> SettingsService:
    return SettingsService(db)


@router.get(
    "",
    response_model=SettingsResponse,
    summary="Get user settings",
    description="Returns the current user's application settings including currency, "
    "language, theme, date format, and notification preferences. "
    "Default settings are auto-created if none exist.",
    responses={
        200: {"description": "Settings retrieved"},
        401: {"description": "Authentication required"},
    },
)
def get_settings(
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(_get_service),
):
    return service.get_settings(current_user)


@router.put(
    "",
    response_model=SettingsUpdateResponse,
    summary="Update settings",
    description="Updates user settings. Supports partial updates — only provided fields "
    "are modified. Returns a success message and the updated settings.",
    responses={
        200: {"description": "Settings updated"},
        401: {"description": "Authentication required"},
    },
)
def update_settings(
    data: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(_get_service),
):
    return service.update_settings(current_user, data)
