from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.point import PointTransaction

WARMTH_RATIO = 10  # 포인트 10pt 당 온기지수 1점


async def earn_points(
    db: AsyncSession,
    user_id: int,
    amount: int,
    reason: str,
    related_id: int | None = None,
) -> PointTransaction:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one()
    user.point_balance += amount
    user.warmth_score += amount // WARMTH_RATIO

    tx = PointTransaction(
        user_id=user_id,
        amount=amount,
        transaction_type="earn",
        reason=reason,
        related_id=related_id,
    )
    db.add(tx)
    await db.flush()
    return tx


async def spend_points(
    db: AsyncSession,
    user_id: int,
    amount: int,
    reason: str,
    related_id: int | None = None,
) -> PointTransaction:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one()
    if user.point_balance < amount:
        raise ValueError("포인트가 부족합니다")
    user.point_balance -= amount

    tx = PointTransaction(
        user_id=user_id,
        amount=-amount,
        transaction_type="spend",
        reason=reason,
        related_id=related_id,
    )
    db.add(tx)
    await db.flush()
    return tx
