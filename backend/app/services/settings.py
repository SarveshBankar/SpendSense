from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.settings import SettingsRepository
from app.schemas.settings import SettingsResponse, SettingsUpdate, SettingsUpdateResponse


class SettingsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SettingsRepository()

    def get_settings(self, current_user: User) -> SettingsResponse:
        s = self.repo.get_by_user(self.db, current_user.id)
        if not s:
            s = self.repo.create(self.db, current_user.id)
        return SettingsResponse.model_validate(s)

    def update_settings(self, current_user: User, data: SettingsUpdate) -> SettingsUpdateResponse:
        s = self.repo.get_by_user(self.db, current_user.id)
        if not s:
            s = self.repo.create(self.db, current_user.id)
        updates = data.model_dump(exclude_none=True)
        s = self.repo.update(self.db, s, updates)
        return SettingsUpdateResponse(
            message="Settings updated successfully",
            settings=SettingsResponse.model_validate(s),
        )
