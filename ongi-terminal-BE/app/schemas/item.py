from pydantic import BaseModel


class ItemCreate(BaseModel):
    title: str
    description: str | None = None
    terminal_id: int | None = None
    desc: str | None = None
    explain: str | None = None
    report_desc: str | None = None


class ItemOut(BaseModel):
    id: int
    donor_id: int | None
    donor_nickname: str | None = None  # 등록자 닉네임 (JOIN으로 채워짐)
    terminal_id: int | None
    title: str
    description: str | None
    desc: str | None
    explain: str | None
    report_desc: str | None
    category: str | None
    tags: str | None
    image_url: str | None
    status: str

    model_config = {"from_attributes": True, "arbitrary_types_allowed": True}


class ItemStatusUpdate(BaseModel):
    status: str


class AIClassifyResult(BaseModel):
    category: str
    tags: list[str]
    confidence: float