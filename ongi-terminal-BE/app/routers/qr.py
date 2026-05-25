from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.item import Item
from app.models.transaction import ItemTransaction
from app.schemas.qr import QRGenerateCheckin, QRGenerateCheckout, QRVerify, QRTokenOut, QRVerifyResult
from app.services.qr_service import create_qr_token, get_valid_token, mark_token_used, generate_qr_image
from app.services.point_service import earn_points

router = APIRouter(prefix="/qr", tags=["qr"])


@router.get("/membership", response_model=QRTokenOut)
async def get_membership_qr(
    current_user: User = Depends(get_current_user),
):
    """온기 회원 QR코드 생성 (유저 ID 연동)"""
    from datetime import datetime, timedelta, timezone
    token_str = f"ongi_member_{current_user.id}"
    img = generate_qr_image(token_str)
    # 1년 뒤 만료되는 장기 회원 토큰
    expired_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=365)
    return QRTokenOut(token=token_str, qr_type="membership", expired_at=expired_at, qr_image_base64=img)


@router.post("/generate/checkin", response_model=QRTokenOut)
async def generate_checkin(
    body: QRGenerateCheckin,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Item).where(Item.id == body.item_id, Item.donor_id == current_user.id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="본인의 물품이 아니거나 존재하지 않습니다")

    qr, img = await create_qr_token(db, current_user.id, "item_checkin", body.item_id, body.terminal_id)
    return QRTokenOut(token=qr.token, qr_type=qr.qr_type, expired_at=qr.expired_at, qr_image_base64=img)


@router.post("/generate/checkout", response_model=QRTokenOut)
async def generate_checkout(
    body: QRGenerateCheckout,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Item).where(Item.id == body.item_id, Item.status == "stored"))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="보관 중인 물품을 찾을 수 없습니다")

    qr, img = await create_qr_token(db, current_user.id, "item_checkout", body.item_id, body.terminal_id)
    return QRTokenOut(token=qr.token, qr_type=qr.qr_type, expired_at=qr.expired_at, qr_image_base64=img)


@router.post("/verify", response_model=QRVerifyResult)
async def verify_qr(
    body: QRVerify,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    qr = await get_valid_token(db, body.token)
    if not qr:
        return QRVerifyResult(success=False, action_type="unknown", item_id=None, message="유효하지 않거나 만료된 QR입니다")

    if qr.qr_type == "item_checkin":
        result = await db.execute(select(Item).where(Item.id == qr.item_id))
        item = result.scalar_one_or_none()
        if item:
            item.status = "stored"
            item.terminal_id = body.terminal_id
        tx = ItemTransaction(item_id=qr.item_id, donor_id=qr.user_id, terminal_id=body.terminal_id, action_type="checked_in")
        db.add(tx)
        await mark_token_used(db, qr)
        return QRVerifyResult(success=True, action_type="checked_in", item_id=qr.item_id, message="물품이 터미널에 보관되었습니다")

    elif qr.qr_type == "item_checkout":
        result = await db.execute(select(Item).where(Item.id == qr.item_id))
        item = result.scalar_one_or_none()
        if item:
            item.status = "taken"
        tx = ItemTransaction(
            item_id=qr.item_id, donor_id=item.donor_id if item else None,
            receiver_id=qr.user_id, terminal_id=body.terminal_id, action_type="received"
        )
        db.add(tx)
        await earn_points(db, qr.user_id, 30, "물품 수령", qr.item_id)
        await mark_token_used(db, qr)
        return QRVerifyResult(success=True, action_type="received", item_id=qr.item_id, message="물품을 수령했습니다. 포인트가 적립되었습니다!")

    return QRVerifyResult(success=False, action_type="unknown", item_id=None, message="알 수 없는 QR 유형입니다")
