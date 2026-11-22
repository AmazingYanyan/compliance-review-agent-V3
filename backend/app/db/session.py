"""数据库会话管理（SQLAlchemy 2.x async + asyncpg）。"""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    """FastAPI 依赖：提供一个请求级数据库会话。"""
    async with AsyncSessionLocal() as session:
        yield session


__all__ = ["AsyncSessionLocal", "engine", "get_db"]
