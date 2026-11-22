"""FastAPI 依赖。"""

from __future__ import annotations

from urllib.parse import urlparse

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.responses import AppError
from app.core.security import decode_access_token
from app.db.models import User
from app.db.session import get_db
from app.services import auth_service

bearer_scheme = HTTPBearer(auto_error=False, description="Bearer access token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_db),
) -> User:
    """解析 Authorization 头并返回当前用户。

    :raises AppError: 令牌缺失 / 无效 / 已过期（401）
    """
    if credentials is None or not credentials.credentials:
        raise AppError(401, "未提供访问令牌")

    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise AppError(401, "访问令牌无效或已过期")

    user = await auth_service.get_user_by_id(session, user_id)
    if user is None or not user.is_active:
        raise AppError(401, "访问令牌无效或已过期")

    return user


def _is_same_origin(origin: str, request: Request) -> bool:
    """判断来源是否与当前请求同源（开发环境走 Vite 同源代理时成立）。"""
    parsed = urlparse(origin)
    return parsed.netloc == request.headers.get("host", "")


async def require_trusted_origin(request: Request) -> None:
    """对使用 Cookie 的写请求校验来源，避免 CSRF。

    同源请求（开发环境 Vite 代理）或白名单来源放行，其余拒绝。
    """
    origin = request.headers.get("origin")
    if origin:
        if origin in settings.allowed_origin_list or _is_same_origin(origin, request):
            return
        raise AppError(403, "请求来源不被信任")

    referer = request.headers.get("referer")
    if referer:
        parsed = urlparse(referer)
        candidate = f"{parsed.scheme}://{parsed.netloc}"
        if candidate in settings.allowed_origin_list or _is_same_origin(candidate, request):
            return
        raise AppError(403, "请求来源不被信任")


__all__ = ["get_current_user", "require_trusted_origin"]
