from sqlalchemy import String, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    donor_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"))
    terminal_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("terminals.id"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(100))
    tags: Mapped[str | None] = mapped_column(String(500))  # comma-separated AI tags
    image_url: Mapped[str | None] = mapped_column(Text)
    # registered → stored → reserved → taken | expired | rejected
    status: Mapped[str] = mapped_column(String(50), default="registered")

    donor: Mapped["User"] = relationship("User", foreign_keys=[donor_id], back_populates="donated_items")
    terminal: Mapped["Terminal"] = relationship("Terminal", back_populates="items")
    transactions: Mapped[list["ItemTransaction"]] = relationship("ItemTransaction", back_populates="item")
    warmth_messages: Mapped[list["WarmthMessage"]] = relationship("WarmthMessage", back_populates="item")
    qr_tokens: Mapped[list["QRToken"]] = relationship("QRToken", back_populates="item")
