import uuid

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import UserCreate


class UserRepository:
    def get_by_email(self, db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email).first()

    def get_by_id(self, db: Session, user_id: uuid.UUID) -> User | None:
        return db.query(User).filter(User.id == user_id).first()

    def create(self, db: Session, data: UserCreate, password_hash: str) -> User:
        user = User(
            full_name=data.full_name,
            email=data.email,
            password_hash=password_hash,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
