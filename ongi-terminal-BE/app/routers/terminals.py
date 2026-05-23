from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.deps import get_current_user, get_current_admin
from app.models.terminal import Terminal
from app.schemas.terminal import TerminalCreate, TerminalUpdate, TerminalOut

router = APIRouter(prefix="/terminals", tags=["terminals"])


@router.get("", response_model=list[TerminalOut])
async def list_terminals(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Terminal).where(Terminal.status == "active"))
    return result.scalars().all()


@router.get("/{terminal_id}", response_model=TerminalOut)
async def get_terminal(terminal_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Terminal).where(Terminal.id == terminal_id))
    terminal = result.scalar_one_or_none()
    if not terminal:
        raise HTTPException(status_code=404, detail="터미널을 찾을 수 없습니다")
    return terminal


@router.post("", response_model=TerminalOut, status_code=201)
async def create_terminal(
    body: TerminalCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    terminal = Terminal(**body.model_dump())
    db.add(terminal)
    await db.flush()
    return terminal


@router.patch("/{terminal_id}", response_model=TerminalOut)
async def update_terminal(
    terminal_id: int,
    body: TerminalUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Terminal).where(Terminal.id == terminal_id))
    terminal = result.scalar_one_or_none()
    if not terminal:
        raise HTTPException(status_code=404, detail="터미널을 찾을 수 없습니다")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(terminal, field, val)
    await db.flush()
    return terminal
