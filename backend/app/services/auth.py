import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.db.session import get_db
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import UserCreate, UserLogin, UserResponse, TokenResponse

_bearer = HTTPBearer()


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository()

    def register(self, data: UserCreate) -> TokenResponse:
        existing = self.repo.get_by_email(self.db, data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists",
            )

        pw_hash = hash_password(data.password)
        user = self.repo.create(self.db, data, pw_hash)
        token = create_access_token(str(user.id))
        return TokenResponse(
            access_token=token, user=UserResponse.model_validate(user)
        )

    def login(self, data: UserLogin) -> TokenResponse:
        user = self.repo.get_by_email(self.db, data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )

        token = create_access_token(str(user.id))
        return TokenResponse(
            access_token=token, user=UserResponse.model_validate(user)
        )

    def get_current_user(
        self, credentials: HTTPAuthorizationCredentials
    ) -> UserResponse:
        try:
            payload = decode_access_token(credentials.credentials)
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token",
                )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        user = self.repo.get_by_id(self.db, uuid.UUID(user_id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return UserResponse.model_validate(user)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)
