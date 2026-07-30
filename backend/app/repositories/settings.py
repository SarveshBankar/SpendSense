import uuid

from sqlalchemy.orm import Session

from app.models.settings import UserSettings


class SettingsRepository:
    def get_by_user(self, db: Session, user_id: uuid.UUID) -> UserSettings | None:
        return db.query(UserSettings).filter(UserSettings.user_id == user_id).first()

    def create(self, db: Session, user_id: uuid.UUID) -> UserSettings:
        s = UserSettings(user_id=user_id)
        db.add(s)
        db.commit()
        db.refresh(s)
        return s

    def update(self, db: Session, settings: UserSettings, data: dict) -> UserSettings:
        for k, v in data.items():
            if v is not None:
                setattr(settings, k, v)
        db.commit()
        db.refresh(settings)
        return settings
