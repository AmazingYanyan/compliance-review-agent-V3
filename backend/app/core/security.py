"""密码哈希与 JWT 令牌工具。"""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

from app.core.config import settings

# Argon2id，默认参数由 argon2-cffi 提供
_password_hasher = PasswordHasher()


class PasswordError(Exception):
    """密码校验失败。"""


def hash_password(password: str) -> str:
    """使用 Argon2id 哈希密码。"""
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """校验密码是否与哈希匹配。"""
    try:
        _password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False
    return True


def generate_refresh_token() -> str:
    """生成不可预测的 refresh token（明文，只交给浏览器 Cookie）。"""
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    """refresh token 的落库哈希（只保存哈希，不保存明文）。"""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(user_id: int, *, expires_minutes: int | None = None) -> str:
    """签发 access token（JWT / HS256）。"""
    now = datetime.now(UTC)
    expire_minutes = (
        settings.access_token_expire_minutes if expires_minutes is None else expires_minutes
    )
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expire_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int | None:
    """解析 access token，返回用户 id；无效或过期返回 None。"""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None
    if payload.get("type") != "access":
        return None
    subject = payload.get("sub")
    if subject is None:
        return None
    try:
        return int(subject)
    except (TypeError, ValueError):
        return None


def refresh_token_expires_at() -> datetime:
    """refresh token 的过期时间。"""
    return datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)


__all__ = [
    "PasswordError",
    "create_access_token",
    "decode_access_token",
    "generate_refresh_token",
    "hash_password",
    "hash_refresh_token",
    "refresh_token_expires_at",
    "verify_password",
]
