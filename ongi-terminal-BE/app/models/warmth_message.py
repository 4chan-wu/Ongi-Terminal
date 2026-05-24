from datetime import datetime
from sqlalchemy import Integer, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class WarmthMessage(Base):
    __tablename__ = "warmth_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("items.id"))
    sender_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"))
    receiver_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"))
    message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    item: Mapped["Item"] = relationship("Item", back_populates="warmth_messages")
