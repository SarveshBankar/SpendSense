from pydantic import BaseModel


class SettingsResponse(BaseModel):
    currency: str
    language: str
    theme: str
    date_format: str
    email_notifications: bool
    push_notifications: bool
    weekly_report: bool

    model_config = {"from_attributes": True}


class SettingsUpdate(BaseModel):
    currency: str | None = None
    language: str | None = None
    theme: str | None = None
    date_format: str | None = None
    email_notifications: bool | None = None
    push_notifications: bool | None = None
    weekly_report: bool | None = None


class SettingsUpdateResponse(BaseModel):
    message: str
    settings: SettingsResponse
