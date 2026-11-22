"""注册 service：把「写入用户」与「投递欢迎任务」收敛到同一个事务。

关键约定：

- 这条路径使用**同一条异步 psycopg 连接**开启事务；
- 先 ``INSERT INTO users``，再把这条连接交给 Procrastinate 投递欢迎任务；
- 两者都成功才提交，任一步失败整体回滚；
- 其他业务路径仍然使用 SQLAlchemy + asyncpg。
"""

from __future__ import annotations

import logging

import psycopg
from psycopg import errors as pg_errors

from app.core.config import settings
from app.core.responses import AppError
from app.core.security import hash_password
from app.queue.app import send_welcome_email
from app.schemas.auth import UserResponse, normalize_email

logger = logging.getLogger(__name__)

_INSERT_USER_SQL = """
    INSERT INTO users (display_name, email, password_hash, is_active, created_at, updated_at)
    VALUES (%s, %s, %s, TRUE, NOW(), NOW())
    RETURNING id, display_name, email
"""


class EmailAlreadyExistsError(Exception):
    """邮箱已被注册（数据库唯一约束冲突）。"""


async def create_user_with_welcome_task(
    *,
    display_name: str,
    email: str,
    password: str,
) -> UserResponse:
    """创建用户并在同一个事务里投递欢迎任务。

    :raises EmailAlreadyExistsError: 邮箱已被注册
    :raises AppError: 其它服务端异常
    """
    normalized_email = normalize_email(email)
    password_hash = hash_password(password)

    conninfo = settings.procrastinate_conninfo
    async with await psycopg.AsyncConnection.connect(conninfo, autocommit=False) as conn:
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(_INSERT_USER_SQL, (display_name, normalized_email, password_hash))
                row = await cursor.fetchone()

            user = UserResponse(id=row[0], display_name=row[1], email=row[2])

            # 用同一条连接投递任务：任务与用户写入同生共死
            await send_welcome_email.configure(connection=conn).defer_async(
                user_id=user.id,
                email=user.email,
                display_name=user.display_name,
            )

            await conn.commit()
        except pg_errors.UniqueViolation as exc:
            await conn.rollback()
            raise EmailAlreadyExistsError(normalized_email) from exc
        except Exception as exc:
            await conn.rollback()
            logger.exception("[registration] 注册事务失败，已回滚")
            raise AppError(500, "注册失败，请稍后重试") from exc

    logger.info("[registration] 用户注册成功 user_id=%s email=%s", user.id, user.email)
    return user


__all__ = ["EmailAlreadyExistsError", "create_user_with_welcome_task"]
