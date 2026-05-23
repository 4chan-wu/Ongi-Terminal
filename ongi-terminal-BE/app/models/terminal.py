from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Integer, DateTime, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Terminal(Base):
    __tablename__ = "terminals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 8))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(11, 8))
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    items: Mapped[list["Item"]] = relationship("Item", back_populates="terminal")
