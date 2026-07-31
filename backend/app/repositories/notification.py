import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationRepository:
    def list_by_user(
        self, db: Session, user_id: uuid.UUID,
        skip: int = 0, limit: int = 50, unread_only: bool = False,
    ) -> list[Notification]:
        q = db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            q = q.filter(Notification.read == False)
        return q.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, notification_id: uuid.UUID) -> Notification | None:
        return db.query(Notification).filter(Notification.id == notification_id).first()

    def count_by_user(self, db: Session, user_id: uuid.UUID) -> int:
        return db.query(Notification).filter(Notification.user_id == user_id).count()

    def unread_count(self, db: Session, user_id: uuid.UUID) -> int:
        return db.query(Notification).filter(
            Notification.user_id == user_id, Notification.read == False
        ).count()

    def create(self, db: Session, user_id: uuid.UUID, **kwargs) -> Notification:
        n = Notification(user_id=user_id, **kwargs)
        db.add(n)
        db.commit()
        db.refresh(n)
        return n

    def mark_read(self, db: Session, notification_id: uuid.UUID) -> Notification | None:
        n = db.query(Notification).filter(Notification.id == notification_id).first()
        if n:
            n.read = True
            db.commit()
            db.refresh(n)
        return n

    def mark_all_read(self, db: Session, user_id: uuid.UUID) -> int:
        count = db.query(Notification).filter(
            Notification.user_id == user_id, Notification.read == False
        ).update({"read": True})
        db.commit()
        return count

    def delete_old(self, db: Session, user_id: uuid.UUID, cutoff: datetime) -> int:
        result = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.created_at < cutoff,
        ).delete()
        db.commit()
        return result
