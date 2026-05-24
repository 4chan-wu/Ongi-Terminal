from datetime import datetime
from pydantic import BaseModel


class QRGenerateCheckin(BaseModel):
    item_id: int
    terminal_id: int


class QRGenerateCheckout(BaseModel):
    item_id: int
    terminal_id: int


class QRVerify(BaseModel):
    token: str
    terminal_id: int


class QRTokenOut(BaseModel):
    token: str
    qr_type: str
    expired_at: datetime
    qr_image_base64: str  # PNG QR 이미지


class QRVerifyResult(BaseModel):
    success: bool
    action_type: str
    item_id: int | None
    message: str
