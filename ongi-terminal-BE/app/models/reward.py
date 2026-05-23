from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Reward(Base):
    __tablename__ = "rewards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    required_points: Mapped[int] = mapped_column(Integer, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[str | None] = mapped_column(Text)

    exchanges: Mapped[list["RewardExchange"]] = relationship("RewardExchange", back_populates="reward")


class RewardExchange(Base):
    __tablename__ = "reward_exchanges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"))
    reward_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("rewards.id"))
    points_used: Mapped[int] = mapped_column(Integer, nullable=False)
    # pending | completed | cancelled
    status: Mapped[str] = mapped_column(String(50), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    reward: Mapped["Reward"] = relationship("Reward", back_populates="exchanges")
