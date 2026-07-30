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


@router.get("", response_model=SettingsResponse, summary="Get user settings")
def get_settings(
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(_get_service),
):
    return service.get_settings(current_user)


@router.put("", response_model=SettingsUpdateResponse, summary="Update settings")
def update_settings(
    data: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(_get_service),
):
    return service.update_settings(current_user, data)
