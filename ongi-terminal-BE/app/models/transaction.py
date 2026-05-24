from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ItemTransaction(Base):
    __tablename__ = "item_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("items.id"))
    donor_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"))
    receiver_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"))
    terminal_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("terminals.id"))
    # registered | checked_in | checked_out | received
    action_type: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    item: Mapped["Item"] = relationship("Item", back_populates="transactions")
