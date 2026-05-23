from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.routers import auth, users, terminals, items, qr, recycle, points, rewards, ai

app = FastAPI(
    title="온기 터미널 API",
    description="지역 자원 순환 플랫폼 — 물건 나눔 + 재활용 + AI 추천",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

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
