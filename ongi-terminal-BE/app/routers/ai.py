import base64
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, UserInterest
from app.models.item import Item
from app.schemas.item import AIClassifyResult
from app.services.ai_features import classify_item, classify_item_with_image, recommend_items, chat_with_bot
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatMessage(BaseModel):
    message: str
    history: list[dict] | None = None


class ChatResponse(BaseModel):
    reply: str


@router.post("/classify", response_model=AIClassifyResult)
async def classify(
    title: str = Form(...),
    description: str | None = Form(None),
    image: UploadFile | None = File(None),
):
    if image:
        content = await image.read()
        b64 = base64.b64encode(content).decode()
        result = await classify_item_with_image(title, b64, image.content_type or "image/jpeg")
    else:
        result = await classify_item(title, description)
    return AIClassifyResult(**result)


@router.get("/recommend", response_model=list[dict])
async def recommend(
    terminal_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interest_result = await db.execute(select(UserInterest).where(UserInterest.user_id == current_user.id))
    interests = [i.tag_name for i in interest_result.scalars().all()]

    q = select(Item).where(Item.status.in_(["registered", "stored"]))
    if terminal_id:
        q = q.where(Item.terminal_id == terminal_id)
    items_result = await db.execute(q.limit(50))
    items = items_result.scalars().all()

    item_dicts = [{"id": i.id, "title": i.title, "category": i.category, "tags": i.tags} for i in items]
    ranked_ids = await recommend_items(interests, item_dicts)

    item_map = {i["id"]: i for i in item_dicts}
    return [item_map[id_] for id_ in ranked_ids if id_ in item_map]


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatMessage, _=Depends(get_current_user)):
    reply = await chat_with_bot(body.message, body.history)
    return ChatResponse(reply=reply)
