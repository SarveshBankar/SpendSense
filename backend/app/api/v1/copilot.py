import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.copilot import (
    MessageRequest,
    MessageResponse,
    ConversationHistoryResponse,
    ConversationMessage,
    ClearConversationResponse,
    SuggestedPromptsResponse,
    SuggestedPrompt,
)
from app.services.copilot import get_copilot_service

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.post(
    "/chat",
    response_model=MessageResponse,
    summary="Send a message to the AI copilot",
    description="Process a natural language query about the user's finances and get an AI-generated response.",
)
def chat(
    body: MessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = get_copilot_service(db)
    reply = service.process_message(current_user.id, body.message)
    return MessageResponse(reply=reply)


@router.get(
    "/history",
    response_model=ConversationHistoryResponse,
    summary="Get conversation history",
    description="Retrieve the user's chat history with the AI copilot.",
)
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = get_copilot_service(db)
    messages = service.get_history(current_user.id)
    return ConversationHistoryResponse(
        messages=[
            ConversationMessage(
                id=m.id,
                role=m.role,
                content=m.content,
                created_at=m.created_at,
            )
            for m in messages
        ]
    )


@router.delete(
    "/history",
    response_model=ClearConversationResponse,
    summary="Clear conversation history",
    description="Delete all copilot chat messages for the current user.",
)
def clear_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = get_copilot_service(db)
    service.clear_history(current_user.id)
    return ClearConversationResponse(message="Conversation history cleared.")


@router.get(
    "/suggestions",
    response_model=SuggestedPromptsResponse,
    summary="Get suggested prompts",
    description="Get a list of suggested questions the user can ask the AI copilot.",
)
def get_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = get_copilot_service(db)
    prompts = service.get_suggested_prompts()
    return SuggestedPromptsResponse(
        prompts=[SuggestedPrompt(**p) for p in prompts]
    )
