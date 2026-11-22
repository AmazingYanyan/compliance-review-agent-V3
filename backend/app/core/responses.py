"""统一 JSON 响应结构。

所有接口返回 `{"code": ..., "msg": "...", "data": ...}`：

- 成功时业务 `code` 恒为 `200`（HTTP 201 的注册成功响应同样是 `200`）；
- 失败时使用真实 HTTP 状态码，业务 `code` 与其保持一致。
"""

from __future__ import annotations

from typing import Any, Generic, TypeVar

from fastapi import status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """统一响应包络。"""

    code: int = Field(default=status.HTTP_200_OK, description="业务状态码")
    msg: str = Field(default="success", description="提示信息")
    data: T | None = Field(default=None, description="业务数据")


def success(data: Any = None, msg: str = "success") -> dict[str, Any]:
    """构造成功响应体。"""
    return {"code": status.HTTP_200_OK, "msg": msg, "data": data}


def failure(code: int, msg: str, data: Any = None) -> dict[str, Any]:
    """构造失败响应体。"""
    return {"code": code, "msg": msg, "data": data}


class AppError(Exception):
    """业务异常。

    携带 HTTP 状态码与业务错误码，由全局异常处理器转成统一响应结构。
    """

    def __init__(
        self,
        status_code: int,
        msg: str,
        *,
        code: int | None = None,
        data: Any = None,
    ) -> None:
        super().__init__(msg)
        self.status_code = status_code
        self.msg = msg
        self.code = code if code is not None else status_code
        self.data = data


def error_response(
    status_code: int,
    msg: str,
    *,
    code: int | None = None,
    data: Any = None,
) -> JSONResponse:
    """构造统一结构的错误响应。"""
    return JSONResponse(
        status_code=status_code,
        content=failure(code if code is not None else status_code, msg, data),
    )


__all__ = [
    "ApiResponse",
    "AppError",
    "error_response",
    "failure",
    "success",
]
