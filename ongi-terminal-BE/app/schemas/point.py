from datetime import datetime
from pydantic import BaseModel


class PointTransactionOut(BaseModel):
    id: int
    amount: int
    transaction_type: str | None
    reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PointBalance(BaseModel):
    balance: int
    warmth_score: int
