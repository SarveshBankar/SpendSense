import uuid

from sqlalchemy.orm import Session

from app.models.conversation import Conversation


class ConversationRepository:
    def list_by_user(self, db: Session, user_id: uuid.UUID, limit: int = 50) -> list[Conversation]:
        return (
            db.query(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.created_at.asc())
            .limit(limit)
            .all()
        )

    def create(self, db: Session, user_id: uuid.UUID, role: str, content: str) -> Conversation:
        msg = Conversation(user_id=user_id, role=role, content=content)
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return msg

    def clear_by_user(self, db: Session, user_id: uuid.UUID) -> None:
        db.query(Conversation).filter(Conversation.user_id == user_id).delete()
        db.commit()
