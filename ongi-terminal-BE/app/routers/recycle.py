import base64
import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.recycle import RecycleRecord
from app.schemas.recycle import RecycleRecordOut, RecycleCoachResult
from app.services.ai_features import recycle_coaching
from app.services.point_service import earn_points
from app.config import settings

router = APIRouter(prefix="/recycle", tags=["recycle"])


@router.post("/checkin", response_model=RecycleCoachResult, status_code=201)
async def recycle_checkin(
    terminal_id: int = Form(...),
    recycle_type: str = Form(...),
    quantity: int = Form(1),
    image: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_b64 = None
    image_url = None
    media_type = "image/jpeg"

    if image:
        content = await image.read()
        image_b64 = base64.b64encode(content).decode()
        media_type = image.content_type or "image/jpeg"
        os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
        filename = f"recycle_{uuid.uuid4()}{os.path.splitext(image.filename or '.jpg')[1]}"
        path = os.path.join(settings.LOCAL_UPLOAD_DIR, filename)
        with open(path, "wb") as f:
            f.write(content)
        image_url = f"/uploads/{filename}"

    result = await recycle_coaching(recycle_type, quantity, image_b64)

    import json
    record = RecycleRecord(
        user_id=current_user.id,
        terminal_id=terminal_id,
        recycle_type=recycle_type,
        quantity=quantity,
        image_url=image_url,
        ai_result=json.dumps(result, ensure_ascii=False),
        point_earned=result["point_earned"],
    )
    db.add(record)
    await db.flush()

    await earn_points(db, current_user.id, result["point_earned"], f"재활용 반납: {recycle_type}", record.id)

    return RecycleCoachResult(**result)


@router.get("/records", response_model=list[RecycleRecordOut])
async def get_records(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(RecycleRecord).where(RecycleRecord.user_id == current_user.id).order_by(RecycleRecord.id.desc()).limit(50)
    result = await db.execute(q)
    return result.scalars().all()
