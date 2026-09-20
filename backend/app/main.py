from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .mrhonda import storage as mrhonda_storage
from .mrhonda.routes import router as mrhonda_router

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

app = FastAPI(title="Mr Honda API")

MRHONDA_ORIGINS = [
    "https://mr-honda.com",
    "https://www.mr-honda.com",
]

allowed_origins = [
    origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(set(allowed_origins) | set(MRHONDA_ORIGINS)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mrhonda_router)


@app.on_event("startup")
def startup() -> None:
    mrhonda_storage.init_db()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}