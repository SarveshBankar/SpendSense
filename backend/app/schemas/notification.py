import uuid
from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    message: str
    severity: str
    read: bool
    metadata_json: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    unread_count: int
    total: int


class NotificationMarkReadResponse(BaseModel):
    message: str


class NotificationMarkAllReadResponse(BaseModel):
    message: str
    marked: int
