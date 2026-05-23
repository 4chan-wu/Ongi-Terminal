from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.point import PointTransaction
from app.schemas.point import PointTransactionOut, PointBalance

router = APIRouter(prefix="/points", tags=["points"])


@router.get("/balance", response_model=PointBalance)
async def get_balance(current_user: User = Depends(get_current_user)):
    return PointBalance(balance=current_user.point_balance, warmth_score=current_user.warmth_score)


@router.get("/history", response_model=list[PointTransactionOut])
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(PointTransaction).where(PointTransaction.user_id == current_user.id).order_by(PointTransaction.id.desc()).limit(100)
    result = await db.execute(q)
    return result.scalars().all()
