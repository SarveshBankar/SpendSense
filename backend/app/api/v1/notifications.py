import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    NotificationMarkReadResponse,
    NotificationMarkAllReadResponse,
)
from app.repositories.notification import NotificationRepository

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get(
    "",
    response_model=NotificationListResponse,
    summary="List notifications",
    description="Get all notifications for the current user with unread count.",
)
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    repo = NotificationRepository()
    notifications = repo.list_by_user(db, current_user.id, skip=skip, limit=limit)
    unread_count = repo.unread_count(db, current_user.id)
    total = repo.count_by_user(db, current_user.id)
    return NotificationListResponse(
        notifications=[
            NotificationResponse(
                id=n.id,
                type=n.type,
                title=n.title,
                message=n.message,
                severity=n.severity,
                read=n.read,
                metadata_json=n.metadata_json,
                created_at=n.created_at,
            )
            for n in notifications
        ],
        unread_count=unread_count,
        total=total,
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationMarkReadResponse,
    summary="Mark notification as read",
    description="Mark a specific notification as read.",
)
def mark_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = NotificationRepository()
    notification = repo.get_by_id(db, notification_id)
    if not notification or str(notification.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    repo.mark_read(db, notification_id)
    return NotificationMarkReadResponse(message="Notification marked as read.")


@router.post(
    "/mark-all-read",
    response_model=NotificationMarkAllReadResponse,
    summary="Mark all notifications as read",
    description="Mark all unread notifications as read for the current user.",
)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = NotificationRepository()
    count = repo.mark_all_read(db, current_user.id)
    return NotificationMarkAllReadResponse(
        message="All notifications marked as read.",
        marked=count,
    )
