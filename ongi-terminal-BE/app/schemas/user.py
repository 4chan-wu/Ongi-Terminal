from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    nickname: str
    password: str


class UserLogin(BaseModel):
    nickname: str
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    nickname: str
    password: str
    name: str | None = None
    phone: str | None = None

class UserOut(BaseModel):
    id: int
    email: str
    nickname: str
    name: str | None = None
    phone: str | None = None
    role: str
    warmth_score: int
    point_balance: int
    created_at: datetime

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: int
    email: str
    nickname: str
    role: str
    warmth_score: int
    point_balance: int
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    nickname: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class InterestIn(BaseModel):
    tag_name: str


class InterestOut(BaseModel):
    id: int
    tag_name: str

    model_config = {"from_attributes": True}
