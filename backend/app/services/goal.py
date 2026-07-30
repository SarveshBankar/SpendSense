import uuid
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.goal import GoalRepository
from app.schemas.goal import (
    GoalResponse,
    GoalCreate,
    GoalUpdate,
    GoalListResponse,
    GoalDeleteResponse,
)


class GoalService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = GoalRepository()

    # ------------------------------------------------------------------ #
    #  List
    # ------------------------------------------------------------------ #
    def list_goals(self, current_user: User) -> GoalListResponse:
        goals = self.repo.list_by_user(self.db, current_user.id)
        responses = [self._enrich(g) for g in goals]
        total_target = sum(r.target_amount for r in responses)
        total_saved = sum(r.current_amount for r in responses)
        return GoalListResponse(
            goals=responses,
            total=len(responses),
            total_target=round(total_target, 2),
            total_saved=round(total_saved, 2),
            overall_progress=round((total_saved / total_target * 100), 1) if total_target > 0 else 0,
        )

    # ------------------------------------------------------------------ #
    #  Create
    # ------------------------------------------------------------------ #
    def create_goal(self, current_user: User, data: GoalCreate) -> GoalResponse:
        goal = self.repo.create(self.db, current_user.id, data.model_dump())
        return self._enrich(goal)

    # ------------------------------------------------------------------ #
    #  Update
    # ------------------------------------------------------------------ #
    def update_goal(
        self, current_user: User, goal_id: uuid.UUID, data: GoalUpdate
    ) -> GoalResponse:
        goal = self.repo.get_by_id(self.db, goal_id)
        if not goal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
        if goal.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your goal")

        updates = data.model_dump(exclude_none=True)
        # Auto-update status to completed if target reached
        new_current = updates.get("current_amount", goal.current_amount)
        target = updates.get("target_amount", goal.target_amount)
        if new_current >= target:
            updates["status"] = "completed"
        elif updates.get("status") != "cancelled":
            updates["status"] = "active"

        goal = self.repo.update(self.db, goal, updates)
        return self._enrich(goal)

    # ------------------------------------------------------------------ #
    #  Delete
    # ------------------------------------------------------------------ #
    def delete_goal(
        self, current_user: User, goal_id: uuid.UUID
    ) -> GoalDeleteResponse:
        goal = self.repo.get_by_id(self.db, goal_id)
        if not goal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
        if goal.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your goal")
        self.repo.delete(self.db, goal)
        return GoalDeleteResponse(message="Goal deleted successfully")

    # ------------------------------------------------------------------ #
    #  Enrich
    # ------------------------------------------------------------------ #
    def _enrich(self, goal) -> GoalResponse:
        progress = round((goal.current_amount / goal.target_amount * 100), 1) if goal.target_amount > 0 else 0
        remaining = round(goal.target_amount - goal.current_amount, 2)
        return GoalResponse(
            id=goal.id,
            user_id=goal.user_id,
            goal_name=goal.goal_name,
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            target_date=goal.target_date,
            status=goal.status,
            created_at=goal.created_at,
            progress_pct=progress,
            remaining_amount=remaining,
        )
