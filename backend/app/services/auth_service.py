"""认证 service。

路由层只负责参数校验和调用，认证逻辑全部集中在这里。
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.responses import AppError
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_token_expires_at,
    verify_password,
)
from app.db.models import RefreshToken, User
from app.schemas.auth import normalize_email

logger = logging.getLogger(__name__)


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    """按规范化后的邮箱查询用户。"""
    result = await session.execute(
        select(User).where(User.email == normalize_email(email))
    )
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    """按 id 查询用户。"""
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def authenticate(
    session: AsyncSession,
    *,
    email: str,
    password: str,
) -> User:
    """校验邮箱 + 密码。

    :raises AppError: 凭据错误（401）或账号被禁用（403）
    """
    user = await get_user_by_email(session, email)
    # 无论用户是否存在都走一次哈希校验，避免通过响应时间区分账号是否存在
    if user is None or not verify_password(password, user.password_hash):
        raise AppError(401, "邮箱或密码错误")

    if not user.is_active:
        raise AppError(403, "账号已被禁用")

    return user


async def issue_refresh_token(
    session: AsyncSession,
    *,
    user_id: int,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> str:
    """签发 refresh token，返回明文（只交给浏览器 Cookie，库里只存哈希）。"""
    raw_token = generate_refresh_token()
    session.add(
        RefreshToken(
            user_id=user_id,
            token_hash=hash_refresh_token(raw_token),
            expires_at=refresh_token_expires_at(),
            user_agent=(user_agent or None) and user_agent[:255],
            ip_address=(ip_address or None) and ip_address[:64],
        )
    )
    await session.commit()
    return raw_token


async def rotate_refresh_token(
    session: AsyncSession,
    *,
    raw_token: str,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[User, str]:
    """轮换 refresh token。

    读取 refresh cookie 对应的会话，撤销旧 token 并签发新 token。

    :returns: (用户, 新的 refresh token 明文)
    :raises AppError: token 无效 / 已撤销 / 已过期（401）
    """
    token_hash = hash_refresh_token(raw_token)
    result = await session.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    record = result.scalar_one_or_none()

    now = datetime.now(UTC)
    if record is None or record.revoked_at is not None or record.expires_at <= now:
        raise AppError(401, "会话已失效，请重新登录")

    user = await get_user_by_id(session, record.user_id)
    if user is None or not user.is_active:
        raise AppError(401, "会话已失效，请重新登录")

    # 撤销旧 token
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.id == record.id)
        .values(revoked_at=now)
    )

    new_raw_token = generate_refresh_token()
    session.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(new_raw_token),
            expires_at=refresh_token_expires_at(),
            user_agent=(user_agent or None) and user_agent[:255],
            ip_address=(ip_address or None) and ip_address[:64],
        )
    )
    await session.commit()

    return user, new_raw_token


async def revoke_refresh_token(session: AsyncSession, *, raw_token: str) -> bool:
    """撤销 refresh 会话。

    支持重复调用：token 不存在或已撤销都视为成功。

    :returns: 是否确实撤销了一个有效会话
    """
    token_hash = hash_refresh_token(raw_token)
    result = await session.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    record = result.scalar_one_or_none()
    if record is None or record.revoked_at is not None:
        return False

    record.revoked_at = datetime.now(UTC)
    await session.commit()
    return True


def build_access_token(user: User) -> str:
    """为用户签发 access token。"""
    return create_access_token(user.id)


__all__ = [
    "authenticate",
    "build_access_token",
    "get_user_by_email",
    "get_user_by_id",
    "issue_refresh_token",
    "revoke_refresh_token",
    "rotate_refresh_token",
]
