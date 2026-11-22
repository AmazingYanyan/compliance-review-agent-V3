"""认证路由。

契约（详见 `HANDOFF.md`）：

===========================================  ==========================================
方法与路径                                     说明
===========================================  ==========================================
``POST /api/v1/auth/register``                 注册，HTTP 201；重复邮箱 409
``POST /api/v1/auth/login``                    登录，返回 ``data.accessToken`` + refresh Cookie
``POST /api/v1/auth/refresh``                  刷新，轮换 refresh token
``POST /api/v1/auth/logout``                   退出，撤销 refresh 会话并清 Cookie
===========================================  ==========================================
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_trusted_origin
from app.core.config import settings
from app.core.responses import AppError, ApiResponse, success
from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services import auth_service
from app.services.registration import EmailAlreadyExistsError, create_user_with_welcome_task

router = APIRouter(prefix="/auth", tags=["认证"])

REFRESH_COOKIE_PATH = "/api/v1/auth"


def _set_refresh_cookie(response: Response, token: str) -> None:
    """下发 HttpOnly refresh cookie。"""
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path=REFRESH_COOKIE_PATH,
    )


def _delete_refresh_cookie(response: Response) -> None:
    """清除 refresh cookie。"""
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=REFRESH_COOKIE_PATH,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[UserResponse],
    summary="注册",
)
async def register(
    payload: RegisterRequest,
    response: Response,
) -> dict:
    """注册新账号。

    注册成功返回 HTTP 201，业务 ``code`` 仍为 200。
    """
    if not settings.registration_enabled:
        raise AppError(403, "当前环境未开放注册")

    try:
        user = await create_user_with_welcome_task(
            display_name=payload.display_name,
            email=payload.email,
            password=payload.password,
        )
    except EmailAlreadyExistsError as exc:
        raise AppError(409, "该邮箱已被注册") from exc

    return success(data=user, msg="注册成功")


@router.post("/login", response_model=ApiResponse[TokenResponse], summary="登录")
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db),
) -> dict:
    """邮箱 + 密码登录。

    成功返回 ``data.accessToken``，同时通过 HttpOnly Cookie 下发 refresh token。
    """
    user = await auth_service.authenticate(
        session, email=payload.email, password=payload.password
    )

    refresh_token = await auth_service.issue_refresh_token(
        session,
        user_id=user.id,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )

    access_token = auth_service.build_access_token(user)
    _set_refresh_cookie(response, refresh_token)

    return success(data={"accessToken": access_token}, msg="登录成功")


@router.post(
    "/refresh",
    response_model=ApiResponse[TokenResponse],
    summary="刷新访问令牌",
    dependencies=[Depends(require_trusted_origin)],
)
async def refresh(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db),
) -> dict:
    """用 refresh cookie 换新的 access token，并轮换 refresh token。"""
    raw_token = request.cookies.get(settings.refresh_cookie_name)
    if not raw_token:
        raise AppError(401, "缺少 refresh 会话，请重新登录")

    user, new_refresh_token = await auth_service.rotate_refresh_token(
        session,
        raw_token=raw_token,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )

    access_token = auth_service.build_access_token(user)
    _set_refresh_cookie(response, new_refresh_token)

    return success(data={"accessToken": access_token}, msg="会话已续期")


@router.post(
    "/logout",
    response_model=ApiResponse[None],
    summary="退出登录",
    dependencies=[Depends(require_trusted_origin)],
)
async def logout(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db),
) -> dict:
    """撤销当前 refresh 会话并清除 Cookie，支持重复调用。"""
    raw_token = request.cookies.get(settings.refresh_cookie_name)
    if raw_token:
        await auth_service.revoke_refresh_token(session, raw_token=raw_token)

    _delete_refresh_cookie(response)
    return success(data=None, msg="已退出登录")


__all__ = ["router"]
