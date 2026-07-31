from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, validate_password_strength
from app.models.user import User
from app.repositories.user import UserRepository
from app.repositories.transaction import TransactionRepository
from app.repositories.statement import StatementRepository
from app.repositories.budget import BudgetRepository
from app.repositories.goal import GoalRepository
from app.schemas.profile import (
    ProfileResponse,
    ProfileUpdate,
    ProfileUpdateResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
)


class ProfileService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository()
        self.tx_repo = TransactionRepository()
        self.stmt_repo = StatementRepository()
        self.budget_repo = BudgetRepository()
        self.goal_repo = GoalRepository()

    def get_profile(self, current_user: User) -> ProfileResponse:
        tx_count = self.tx_repo.count_by_user(self.db, current_user.id)
        stmt_count = self.stmt_repo.count_by_user(self.db, current_user.id)
        budget_count = self.budget_repo.count_by_user(self.db, current_user.id)
        goal_count = self.goal_repo.count_by_user(self.db, current_user.id)
        return ProfileResponse(
            id=current_user.id,
            full_name=current_user.full_name,
            email=current_user.email,
            is_active=current_user.is_active,
            created_at=current_user.created_at.isoformat() if hasattr(current_user.created_at, 'isoformat') else str(current_user.created_at),
            updated_at=current_user.updated_at.isoformat() if hasattr(current_user.updated_at, 'isoformat') else str(current_user.updated_at),
            total_transactions=tx_count,
            total_statements=stmt_count,
            total_budgets=budget_count,
            total_goals=goal_count,
        )

    def update_profile(self, current_user: User, data: ProfileUpdate) -> ProfileUpdateResponse:
        updates = data.model_dump(exclude_none=True)
        if "email" in updates:
            existing = self.repo.get_by_email(self.db, updates["email"])
            if existing and existing.id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already in use",
                )
        user = self.repo.update(self.db, current_user, updates)
        return ProfileUpdateResponse(
            message="Profile updated successfully",
            user=self.get_profile(user),
        )

    def change_password(self, current_user: User, data: ChangePasswordRequest) -> ChangePasswordResponse:
        if not verify_password(data.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        try:
            validate_password_strength(data.new_password)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
        new_hash = hash_password(data.new_password)
        self.repo.update(self.db, current_user, {"password_hash": new_hash})
        return ChangePasswordResponse(message="Password changed successfully")
