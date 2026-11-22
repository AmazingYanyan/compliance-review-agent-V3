"""pytest 公共 fixture。

测试跑在独立的 PostgreSQL 库（默认 ``compliance_test``）上，与开发库隔离：

- 必须使用真实 PostgreSQL：注册事务依赖 psycopg + Procrastinate，SQLite 无法覆盖；
- 迁移由 Alembic 执行，队列表由 ``python -m app.queue.setup`` 初始化；
- 覆盖 ``DATABASE_URL`` / ``PROCRASTINATE_DATABASE_URL`` 必须在导入 app 之前完成，
  因为 ``app.core.config`` 与 ``app.db.session`` 在导入时就会创建引擎。
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def _read_env_file(path: Path) -> dict[str, str]:
    """读取简单的 KEY=VALUE 环境文件。"""
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip()
    return values


def _with_db_name(url: str, name: str) -> str:
    """把连接串里的库名替换掉。"""
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, f"/{name}", parts.query, parts.fragment))


_ENV_FILE = _read_env_file(BACKEND_ROOT / ".env")

BASE_DATABASE_URL = os.environ.get("DATABASE_URL") or _ENV_FILE.get(
    "DATABASE_URL",
    "postgresql+asyncpg://compliance:compliance@localhost:5433/compliance",
)
BASE_QUEUE_URL = os.environ.get("PROCRASTINATE_DATABASE_URL") or _ENV_FILE.get(
    "PROCRASTINATE_DATABASE_URL",
    "postgresql://compliance:compliance@localhost:5433/compliance",
)

TEST_DB_NAME = os.environ.get("TEST_DATABASE_NAME", "compliance_test")
TEST_DATABASE_URL = _with_db_name(BASE_DATABASE_URL, TEST_DB_NAME)
TEST_QUEUE_URL = _with_db_name(BASE_QUEUE_URL, TEST_DB_NAME)
TEST_ADMIN_URL = _with_db_name(BASE_DATABASE_URL.replace("+asyncpg", ""), "postgres")

# 必须在导入 app 之前设置：pydantic-settings 中环境变量优先级高于 .env 文件
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["PROCRASTINATE_DATABASE_URL"] = TEST_QUEUE_URL
os.environ["APP_ENV"] = "test"

import asyncpg  # noqa: E402
import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402

#: 通用测试账号
TEST_EMAIL = "pytest.user@example.com"
TEST_PASSWORD = "Pytest@12345"
TEST_DISPLAY_NAME = "Pytest 用户"


@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepared_database() -> None:
    """准备测试库：建库 → Alembic 迁移 → 初始化 Procrastinate 队列表。"""
    admin = await asyncpg.connect(TEST_ADMIN_URL)
    try:
        exists = await admin.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", TEST_DB_NAME
        )
        if not exists:
            await admin.execute(f'CREATE DATABASE "{TEST_DB_NAME}"')
    finally:
        await admin.close()

    env = {**os.environ, "DATABASE_URL": TEST_DATABASE_URL}
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_ROOT,
        env=env,
        check=True,
        capture_output=True,
    )
    subprocess.run(
        [sys.executable, "-m", "app.queue.setup"],
        cwd=BACKEND_ROOT,
        env=env,
        check=True,
        capture_output=True,
    )


@pytest_asyncio.fixture(autouse=True)
async def clean_tables(prepared_database: None):
    """每个用例前清空业务表与队列表，保证用例之间互不影响。"""
    async with engine.begin() as conn:
        await conn.execute(text("TRUNCATE users, refresh_tokens RESTART IDENTITY CASCADE"))
        await conn.execute(
            text(
                "TRUNCATE procrastinate_events, procrastinate_jobs, procrastinate_workers "
                "RESTART IDENTITY CASCADE"
            )
        )
    yield


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    """直接走 ASGI 的 HTTP 客户端（不经过网络，Cookie 由客户端自动保存）。"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http_client:
        yield http_client


@pytest_asyncio.fixture
async def registered_user(client: AsyncClient) -> dict:
    """预先注册一个账号，返回注册响应数据。"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "displayName": TEST_DISPLAY_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["data"]


@pytest_asyncio.fixture
async def logged_in_client(client: AsyncClient) -> AsyncClient:
    """已登录状态的客户端（持有 refresh cookie）。"""
    registered = await client.post(
        "/api/v1/auth/register",
        json={
            "displayName": TEST_DISPLAY_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        },
    )
    assert registered.status_code == 201, registered.text

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200, response.text
    return client


__all__ = [
    "TEST_DATABASE_URL",
    "TEST_DISPLAY_NAME",
    "TEST_EMAIL",
    "TEST_PASSWORD",
    "client",
    "logged_in_client",
    "registered_user",
]
