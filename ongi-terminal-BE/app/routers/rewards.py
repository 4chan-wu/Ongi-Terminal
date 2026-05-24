from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.deps import get_current_user, get_current_admin
from app.models.user import User
from app.models.reward import Reward, RewardExchange
from app.schemas.reward import RewardOut, RewardCreate, ExchangeRequest, ExchangeOut
from app.services.point_service import spend_points

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.get("", response_model=list[RewardOut])
async def list_rewards(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Reward).where(Reward.stock > 0))
    return result.scalars().all()


@router.post("", response_model=RewardOut, status_code=201)
async def create_reward(
    body: RewardCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    reward = Reward(**body.model_dump())
    db.add(reward)
    await db.flush()
    return reward


@router.post("/exchange", response_model=ExchangeOut, status_code=201)
async def exchange_reward(
    body: ExchangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Reward).where(Reward.id == body.reward_id))
    reward = result.scalar_one_or_none()
    if not reward:
        raise HTTPException(status_code=404, detail="리워드를 찾을 수 없습니다")
    if reward.stock <= 0:
        raise HTTPException(status_code=400, detail="재고가 없습니다")

    try:
        await spend_points(db, current_user.id, reward.required_points, f"리워드 교환: {reward.name}", reward.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    reward.stock -= 1
    exchange = RewardExchange(user_id=current_user.id, reward_id=reward.id, points_used=reward.required_points)
    db.add(exchange)
    await db.flush()
    return exchange


@router.get("/exchanges", response_model=list[ExchangeOut])
async def get_my_exchanges(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(RewardExchange).where(RewardExchange.user_id == current_user.id).order_by(RewardExchange.id.desc())
    )
    return result.scalars().all()
