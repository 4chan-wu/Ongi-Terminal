from datetime import datetime
from pydantic import BaseModel


class RecycleCheckin(BaseModel):
    terminal_id: int
    recycle_type: str
    quantity: int = 1


class RecycleRecordOut(BaseModel):
    id: int
    terminal_id: int | None
    recycle_type: str | None
    quantity: int | None
    ai_result: str | None
    point_earned: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class RecycleCoachResult(BaseModel):
    guide: str
    point_earned: int
    category: str
    tips: list[str]
