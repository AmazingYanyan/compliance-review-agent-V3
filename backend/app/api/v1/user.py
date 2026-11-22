"""用户信息路由。"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.responses import ApiResponse, success
from app.db.models import User
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/user", tags=["用户"])


@router.get("/info", response_model=ApiResponse[UserResponse], summary="获取当前用户信息")
async def get_user_info(user: User = Depends(get_current_user)) -> dict:
    """返回当前登录用户的 id、显示名和邮箱。

    需要 ``Authorization: Bearer <accessToken>``。
    """
    return success(
        data=UserResponse(id=user.id, display_name=user.display_name, email=user.email)
    )


__all__ = ["router"]
