from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class TerminalCreate(BaseModel):
    name: str
    address: str
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    status: str = "active"


class TerminalUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    status: str | None = None


class TerminalOut(BaseModel):
    id: int
    name: str
    address: str
    latitude: Decimal | None
    longitude: Decimal | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
