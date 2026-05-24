from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class RecycleRecord(Base):
    __tablename__ = "recycle_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"))
    terminal_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("terminals.id"))
    recycle_type: Mapped[str | None] = mapped_column(String(50))
    quantity: Mapped[int | None] = mapped_column(Integer)
    image_url: Mapped[str | None] = mapped_column(Text)
    ai_result: Mapped[str | None] = mapped_column(Text)
    point_earned: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
