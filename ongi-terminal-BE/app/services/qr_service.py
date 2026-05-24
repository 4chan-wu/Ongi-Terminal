import base64
import io
import uuid
from datetime import datetime, timedelta, timezone

import qrcode
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.qr_token import QRToken


def _generate_qr_image(data: str) -> str:
    """QR 데이터를 base64 PNG 이미지로 변환"""
    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


async def create_qr_token(
    db: AsyncSession,
    user_id: int,
    qr_type: str,
    item_id: int | None = None,
    terminal_id: int | None = None,
    expire_minutes: int = 30,
) -> tuple[QRToken, str]:
    token_str = str(uuid.uuid4())
    expired_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=expire_minutes)
    qr_token = QRToken(
        token=token_str,
        user_id=user_id,
        item_id=item_id,
        terminal_id=terminal_id,
        qr_type=qr_type,
        expired_at=expired_at,
    )
    db.add(qr_token)
    await db.flush()

    qr_image = _generate_qr_image(token_str)
    return qr_token, qr_image


async def get_valid_token(db: AsyncSession, token_str: str) -> QRToken | None:
    result = await db.execute(select(QRToken).where(QRToken.token == token_str))
    qr = result.scalar_one_or_none()
    if not qr:
        return None
    if qr.used_at:
        return None
    if qr.expired_at and qr.expired_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return None
    return qr


async def mark_token_used(db: AsyncSession, qr: QRToken) -> None:
    qr.used_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.flush()
