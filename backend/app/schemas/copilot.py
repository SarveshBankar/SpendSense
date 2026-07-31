import uuid
from datetime import datetime

from pydantic import BaseModel


class MessageRequest(BaseModel):
    message: str


class MessageResponse(BaseModel):
    reply: str


class ConversationMessage(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationHistoryResponse(BaseModel):
    messages: list[ConversationMessage]


class ClearConversationResponse(BaseModel):
    message: str


class SuggestedPrompt(BaseModel):
    label: str
    query: str


class SuggestedPromptsResponse(BaseModel):
    prompts: list[SuggestedPrompt]
