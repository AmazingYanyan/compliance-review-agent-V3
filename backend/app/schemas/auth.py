"""认证相关的 Pydantic v2 模型。

对外契约使用 camelCase（`displayName` / `accessToken`），
内部字段保持 snake_case，通过 `alias` + `populate_by_name` 兼容两种写法。
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128
DISPLAY_NAME_MIN_LENGTH = 2
DISPLAY_NAME_MAX_LENGTH = 32


def _validate_password_strength(password: str) -> str:
    """密码规则：长度 8-128，且至少包含一个字母和一个数字。"""
    if not (PASSWORD_MIN_LENGTH <= len(password) <= PASSWORD_MAX_LENGTH):
        raise ValueError(f"密码长度需在 {PASSWORD_MIN_LENGTH} 到 {PASSWORD_MAX_LENGTH} 位之间")
    if not any(char.isalpha() for char in password):
        raise ValueError("密码需包含字母")
    if not any(char.isdigit() for char in password):
        raise ValueError("密码需包含数字")
    return password


def normalize_email(email: str) -> str:
    """邮箱规范化：去空白并转小写。"""
    return email.strip().lower()


class RegisterRequest(BaseModel):
    """注册请求体。"""

    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    display_name: str = Field(
        alias="displayName",
        min_length=DISPLAY_NAME_MIN_LENGTH,
        max_length=DISPLAY_NAME_MAX_LENGTH,
    )
    email: EmailStr
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        return _validate_password_strength(value)

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        return normalize_email(str(value))


class LoginRequest(BaseModel):
    """登录请求体。"""

    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    email: EmailStr
    password: str = Field(min_length=1, max_length=PASSWORD_MAX_LENGTH)

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        return normalize_email(str(value))


class TokenResponse(BaseModel):
    """登录 / 刷新响应体。"""

    model_config = ConfigDict(populate_by_name=True)

    access_token: str = Field(alias="accessToken")


class UserResponse(BaseModel):
    """用户信息响应体。"""

    model_config = ConfigDict(populate_by_name=True)

    id: int
    display_name: str = Field(alias="displayName")
    email: str


class HealthResponse(BaseModel):
    """健康检查响应体。"""

    model_config = ConfigDict(populate_by_name=True)

    status: str
    database: str
    version: str


class AuthConfigResponse(BaseModel):
    """公开的认证配置（前端据此隐藏注册入口）。"""

    model_config = ConfigDict(populate_by_name=True)

    registration_enabled: bool = Field(alias="registrationEnabled")


__all__ = [
    "AuthConfigResponse",
    "DISPLAY_NAME_MAX_LENGTH",
    "DISPLAY_NAME_MIN_LENGTH",
    "PASSWORD_MAX_LENGTH",
    "PASSWORD_MIN_LENGTH",
    "HealthResponse",
    "LoginRequest",
    "RegisterRequest",
    "TokenResponse",
    "UserResponse",
    "normalize_email",
]
