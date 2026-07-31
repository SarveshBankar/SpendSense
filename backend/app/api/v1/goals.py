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


@router.get(
    "",
    response_model=GoalListResponse,
    summary="List savings goals",
    description="Returns all savings goals for the current user. Each goal includes "
    "computed fields: progress_pct (0–100) and remaining_amount.",
    responses={
        200: {"description": "Goals retrieved"},
        401: {"description": "Authentication required"},
    },
)
def list_goals(
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(_get_service),
):
    return service.list_goals(current_user)


@router.post(
    "",
    response_model=GoalResponse,
    status_code=201,
    summary="Create a savings goal",
    description="Creates a new savings goal with a name, target amount, and target date. "
    "Optionally set an initial current_amount (defaults to 0).",
    responses={
        201: {"description": "Goal created"},
        401: {"description": "Authentication required"},
    },
)
def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(_get_service),
):
    return service.create_goal(current_user, data)


@router.put(
    "/{goal_id}",
    response_model=GoalResponse,
    summary="Update a savings goal",
    description="Updates goal fields (name, amounts, date, status). "
    "Status auto-transitions to 'completed' when current_amount reaches target.",
    responses={
        200: {"description": "Goal updated"},
        401: {"description": "Authentication required"},
        404: {"description": "Goal not found"},
    },
)
def update_goal(
    goal_id: uuid.UUID,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(_get_service),
):
    return service.update_goal(current_user, goal_id, data)


@router.delete(
    "/{goal_id}",
    response_model=GoalDeleteResponse,
    summary="Delete a savings goal",
    description="Permanently deletes a savings goal.",
    responses={
        200: {"description": "Goal deleted"},
        401: {"description": "Authentication required"},
        404: {"description": "Goal not found"},
    },
)
def delete_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(_get_service),
):
    return service.delete_goal(current_user, goal_id)
