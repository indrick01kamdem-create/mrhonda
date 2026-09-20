from __future__ import annotations

import os

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

_engine: Engine | None = None


def database_url() -> str | None:
    return os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")


def database_enabled() -> bool:
    return bool(database_url())


def normalized_database_url() -> str:
    url = database_url()
    if not url:
        raise RuntimeError("DATABASE_URL or NEON_DATABASE_URL is required")
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url.removeprefix("postgres://")
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url.removeprefix("postgresql://")
    return url


def engine() -> Engine:
    global _engine
    if _engine is None:
        _engine = create_engine(normalized_database_url(), pool_pre_ping=True)
    return _engine