from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.routers import auth, users, terminals, items, qr, recycle, points, rewards, ai
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.terminal import Terminal

app = FastAPI(
    title="온기 터미널 API",
    description="지역 자원 순환 플랫폼 — 물건 나눔 + 재활용 + AI 추천",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

@app.on_event("startup")
async def create_default_terminals():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Terminal))
        existing = result.scalars().all()
        if len(existing) == 0:
            terminals_data = [
                Terminal(name="카페 앞 터미널", address="서울시 온기구 햇살동 14-2", latitude=37.5665, longitude=126.9780, status="active"),
                Terminal(name="주민센터 터미널", address="서울시 온기구 햇살동 주민자치센터", latitude=37.5670, longitude=126.9785, status="active"),
                Terminal(name="지하철역 터미널", address="서울시 온기구 온기역 3번 출구", latitude=37.5660, longitude=126.9775, status="active"),
            ]
            for t in terminals_data:
                db.add(t)
            await db.commit()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(terminals.router)
app.include_router(items.router)
app.include_router(qr.router)
app.include_router(recycle.router)
app.include_router(points.router)
app.include_router(rewards.router)
app.include_router(ai.router)

os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.LOCAL_UPLOAD_DIR), name="uploads")

@app.get("/health")
async def health():
    return {"status": "ok"}