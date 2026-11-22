"""应用配置。

配置全部来自环境变量（可用根目录 `.env` 覆盖），路由层只做参数校验，
认证逻辑集中在 service 层，两者都不直接读取环境变量。
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """后端运行配置。"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- 应用 ---
    app_name: str = "compliance-review-agent"
    app_env: str = "development"
    debug: bool = True
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # --- 数据库 ---
    # 业务访问：SQLAlchemy 2.x async + asyncpg
    database_url: str = "postgresql+asyncpg://compliance:compliance@localhost:5433/compliance"
    # 队列访问：Procrastinate + psycopg（与业务同一个 PostgreSQL 实例）
    procrastinate_database_url: str = (
        "postgresql://compliance:compliance@localhost:5433/compliance"
    )

    # --- JWT / 会话 ---
    jwt_secret: str = "change-me-to-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    refresh_cookie_name: str = "refresh_token"
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_secure: bool = False

    # --- 注册开关 ---
    registration_enabled: bool = True

    # --- CORS / 来源校验 ---
    allowed_origins: str = "http://localhost:3006,http://127.0.0.1:3006"

    # --- Procrastinate worker ---
    procrastinate_concurrency: int = 2

    @property
    def allowed_origin_list(self) -> list[str]:
        """允许的前端来源列表。"""
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def procrastinate_conninfo(self) -> str:
        """Procrastinate 使用的 psycopg 连接串（去掉 SQLAlchemy 驱动前缀）。"""
        url = self.procrastinate_database_url
        for prefix in ("postgresql+psycopg://", "postgresql+asyncpg://"):
            if url.startswith(prefix):
                return url.replace(prefix, "postgresql://", 1)
        return url

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() in {"production", "prod"}


@lru_cache
def get_settings() -> Settings:
    """返回进程级单例配置。"""
    return Settings()


settings = get_settings()

__all__ = ["Settings", "get_settings", "settings"]
