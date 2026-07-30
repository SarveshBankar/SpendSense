import uuid
from datetime import datetime

from pydantic import BaseModel


class TransactionResponse(BaseModel):
    id: uuid.UUID
    statement_id: uuid.UUID
    date: str
    description: str
    amount: float
    balance: float | None
    transaction_type: str
    merchant: str | None
    payment_mode: str | None
    reference_number: str | None
    raw_text: str | None
    row_index: int
    category: str | None
    confidence_score: int | None
    matched_rule: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ParseResultResponse(BaseModel):
    status: str
    total_rows: int
    successful: int
    failed: int
    errors: list[str]
    transactions: list[TransactionResponse]


class TransactionListResponse(BaseModel):
    transactions: list[TransactionResponse]
    total: int


class CategoryCount(BaseModel):
    category: str
    count: int


class CategorizationSummaryResponse(BaseModel):
    total_transactions: int
    categorized: int
    uncategorized: int
    category_wise: list[CategoryCount]
