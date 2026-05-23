from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class QRToken(Base):
    __tablename__ = "qr_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"))
    item_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("items.id"))
    terminal_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("terminals.id"))
    # item_checkin | item_checkout | recycle_checkin
    qr_type: Mapped[str | None] = mapped_column(String(50))
    expired_at: Mapped[datetime | None] = mapped_column(DateTime)
    used_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    item: Mapped["Item"] = relationship("Item", back_populates="qr_tokens")
