import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.goal import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    GoalListResponse,
    GoalDeleteResponse,
)
from app.services.goal import GoalService

router = APIRouter(prefix="/goals", tags=["goals"])


def _get_service(db: Session = Depends(get_db)) -> GoalService:
    return GoalService(db)


@router.get("", response_model=GoalListResponse, summary="List savings goals")
def list_goals(
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(_get_service),
):
    return service.list_goals(current_user)


@router.post("", response_model=GoalResponse, status_code=201, summary="Create a savings goal")
def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(_get_service),
):
    return service.create_goal(current_user, data)


@router.put("/{goal_id}", response_model=GoalResponse, summary="Update a savings goal")
def update_goal(
    goal_id: uuid.UUID,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(_get_service),
):
    return service.update_goal(current_user, goal_id, data)


@router.delete("/{goal_id}", response_model=GoalDeleteResponse, summary="Delete a savings goal")
def delete_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(_get_service),
):
    return service.delete_goal(current_user, goal_id)
