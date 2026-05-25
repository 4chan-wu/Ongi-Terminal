import os
import uuid
import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.item import Item
from app.models.transaction import ItemTransaction
from app.schemas.item import ItemOut, ItemStatusUpdate, AIClassifyResult
from app.services.ai_features import classify_item, classify_item_with_image
from app.services.point_service import earn_points
from app.config import settings

router = APIRouter(prefix="/items", tags=["items"])

VALID_STATUSES = {"registered", "stored", "reserved", "taken", "expired", "rejected"}


@router.post("", response_model=ItemOut, status_code=201)
async def create_item(
    title: str = Form(...),
    category: str = Form("기타"),
    description: str | None = Form(None),
    terminal_id: int | None = Form(None),
    image: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    desc: str | None = Form(None),
    explain: str | None = Form(None),
    report_desc: str | None = Form(None),
):
    image_url = None
    image_b64 = None
    media_type = "image/jpeg"

    if image:
        content = await image.read()
        image_b64 = base64.b64encode(content).decode()
        media_type = image.content_type or "image/jpeg"
        # 로컬 저장
        os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
        filename = f"{uuid.uuid4()}{os.path.splitext(image.filename or '.jpg')[1]}"
        path = os.path.join(settings.LOCAL_UPLOAD_DIR, filename)
        with open(path, "wb") as f:
            f.write(content)
        image_url = f"/uploads/{filename}"

    ai = {"category": category, "tags": []}

    item = Item(
        donor_id=current_user.id,
        terminal_id=terminal_id,
        title=title,
        description=description,
        desc=desc,
        explain=explain,
        report_desc=report_desc,
        category=ai["category"],
        tags=",".join(ai["tags"]),
        image_url=image_url,
        status="registered",
    )
    db.add(item)
    await db.flush()

    tx = ItemTransaction(item_id=item.id, donor_id=current_user.id, terminal_id=terminal_id, action_type="registered")
    db.add(tx)

    await earn_points(db, current_user.id, 20, "물품 나눔 등록", item.id)

    return item

@router.get("", response_model=list[ItemOut])
async def list_items(
    terminal_id: int | None = None,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Item).where(Item.status.in_(["registered", "stored"]))
    if terminal_id:
        q = q.where(Item.terminal_id == terminal_id)
    if category:
        q = q.where(Item.category == category)
    result = await db.execute(q.order_by(Item.id.desc()).limit(100))
    return result.scalars().all()

@router.get("/my", response_model=list[ItemOut])
async def list_my_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Item)
        .where(Item.donor_id == current_user.id)
        .order_by(Item.id.desc())
    )
    return result.scalars().all()


@router.get("/received", response_model=list[ItemOut])
async def list_received_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (
        select(Item)
        .join(ItemTransaction, ItemTransaction.item_id == Item.id)
        .where(
            ItemTransaction.receiver_id == current_user.id,
            ItemTransaction.action_type == "checked_out",
        )
        .order_by(Item.id.desc())
    )
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{item_id}", response_model=ItemOut)
async def get_item(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="물품을 찾을 수 없습니다")
    return item



@router.patch("/{item_id}/status", response_model=ItemOut)
async def update_item_status(
    item_id: int,
    body: ItemStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 상태: {body.status}")
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="물품을 찾을 수 없습니다")
    if item.donor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="권한이 없습니다")
    item.status = body.status
    await db.flush()
    return item


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="물품을 찾을 수 없습니다")
    if item.donor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="권한이 없습니다")
    await db.delete(item)
