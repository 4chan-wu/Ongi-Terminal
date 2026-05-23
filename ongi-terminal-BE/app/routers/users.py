from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, UserInterest
from app.schemas.user import UserOut, UserUpdate, InterestIn, InterestOut
from app.schemas.point import PointBalance

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.nickname:
        current_user.nickname = body.nickname
    await db.flush()
    return current_user


@router.get("/me/balance", response_model=PointBalance)
async def get_balance(current_user: User = Depends(get_current_user)):
    return PointBalance(balance=current_user.point_balance, warmth_score=current_user.warmth_score)


@router.get("/me/interests", response_model=list[InterestOut])
async def get_interests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(UserInterest).where(UserInterest.user_id == current_user.id))
    return result.scalars().all()


@router.post("/me/interests", response_model=InterestOut, status_code=201)
async def add_interest(
    body: InterestIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interest = UserInterest(user_id=current_user.id, tag_name=body.tag_name)
    db.add(interest)
    await db.flush()
    return interest


@router.delete("/me/interests/{tag_name}", status_code=204)
async def delete_interest(
    tag_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserInterest).where(UserInterest.user_id == current_user.id, UserInterest.tag_name == tag_name)
    )
    interest = result.scalar_one_or_none()
    if not interest:
        raise HTTPException(status_code=404, detail="관심사를 찾을 수 없습니다")
    await db.delete(interest)
