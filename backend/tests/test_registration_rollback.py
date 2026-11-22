"""注册事务回滚测试。

场景：注册写入 users 之后、事务提交之前，欢迎任务投递失败，
此时必须整体回滚——用**另一条连接**查询，断言该邮箱的用户记录不存在。
该用例不需要启动 worker。
"""

from __future__ import annotations

import asyncpg
import pytest
from httpx import AsyncClient

from app.services import registration
from tests.conftest import (
    TEST_DATABASE_URL,
    TEST_DISPLAY_NAME,
    TEST_PASSWORD,
)

ROLLBACK_EMAIL = "rollback@example.com"

#: 用普通业务连接（asyncpg）查库，与注册事务里的 psycopg 连接相互独立
ASYNC_CONNECTION_URL = TEST_DATABASE_URL.replace("+asyncpg", "")


class _DeferError(RuntimeError):
    """模拟投递任务失败。"""


class _BrokenDeferrer:
    """投递必然失败的 JobDeferrer 替身。"""

    async def defer_async(self, **kwargs: object) -> None:
        raise _DeferError("模拟 Procrastinate 投递失败")


class _BrokenTask:
    """send_welcome_email 的替身对象。"""

    def configure(self, **kwargs: object) -> _BrokenDeferrer:
        return _BrokenDeferrer()


async def test_register_rolls_back_when_welcome_task_fails(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """投递失败 → 注册整体回滚 → 数据库里查不到该用户。"""
    monkeypatch.setattr(registration, "send_welcome_email", _BrokenTask())

    response = await client.post(
        "/api/v1/auth/register",
        json={
            "displayName": TEST_DISPLAY_NAME,
            "email": ROLLBACK_EMAIL,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 500
    payload = response.json()
    assert payload["code"] == 500
    assert payload["msg"] == "注册失败，请稍后重试"

    # 用另一条连接查库：用户记录必须不存在
    conn = await asyncpg.connect(ASYNC_CONNECTION_URL)
    try:
        user_count = await conn.fetchval(
            "SELECT count(*) FROM users WHERE email = $1", ROLLBACK_EMAIL
        )
        job_count = await conn.fetchval(
            "SELECT count(*) FROM procrastinate_jobs WHERE args ->> 'email' = $1",
            ROLLBACK_EMAIL,
        )
    finally:
        await conn.close()

    assert user_count == 0
    assert job_count == 0


async def test_register_succeeds_and_queues_welcome_task(
    client: AsyncClient,
) -> None:
    """正常注册：用户落库，并且欢迎任务进入队列。"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "displayName": TEST_DISPLAY_NAME,
            "email": ROLLBACK_EMAIL,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 201

    conn = await asyncpg.connect(ASYNC_CONNECTION_URL)
    try:
        user_count = await conn.fetchval(
            "SELECT count(*) FROM users WHERE email = $1", ROLLBACK_EMAIL
        )
        job = await conn.fetchrow(
            "SELECT task_name, status FROM procrastinate_jobs WHERE args ->> 'email' = $1",
            ROLLBACK_EMAIL,
        )
    finally:
        await conn.close()

    assert user_count == 1
    assert job is not None
    assert job["task_name"] == "send_welcome_email"
    # 未启动 worker 时任务停留在 todo
    assert job["status"] == "todo"
