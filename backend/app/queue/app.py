"""Procrastinate 队列应用实例与任务定义。

队列与应用共用同一个 PostgreSQL 数据库，但使用不同的连接串：

- ``DATABASE_URL``：业务访问，SQLAlchemy 2.x async + asyncpg
- ``PROCRASTINATE_DATABASE_URL``：队列访问，Procrastinate + psycopg
"""

from __future__ import annotations

import logging

import procrastinate
from procrastinate.psycopg_connector import PsycopgConnector

from app.core.config import settings

logger = logging.getLogger(__name__)

# Procrastinate 连接器（连接池在 open_async 时创建）
connector = PsycopgConnector(conninfo=settings.procrastinate_conninfo)

# Procrastinate 应用实例
queue_app = procrastinate.App(connector=connector)


@queue_app.task(name="send_welcome_email")
async def send_welcome_email(user_id: int, email: str, display_name: str) -> str:
    """新用户欢迎任务。

    本轮只写日志，不真正发送邮件；后续接入邮件服务时在这里替换实现。
    """
    logger.info(
        "[send_welcome_email] user_id=%s email=%s display_name=%s",
        user_id,
        email,
        display_name,
    )
    return f"welcome email handled for {email}"


__all__ = ["connector", "queue_app", "send_welcome_email"]
