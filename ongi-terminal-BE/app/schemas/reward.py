from datetime import datetime
from pydantic import BaseModel


class RewardOut(BaseModel):
    id: int
    name: str
    description: str | None
    required_points: int
    stock: int
    image_url: str | None

    model_config = {"from_attributes": True}


class RewardCreate(BaseModel):
    name: str
    description: str | None = None
    required_points: int
    stock: int = 0
    image_url: str | None = None


class ExchangeRequest(BaseModel):
    reward_id: int


class ExchangeOut(BaseModel):
    id: int
    reward_id: int | None
    points_used: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
