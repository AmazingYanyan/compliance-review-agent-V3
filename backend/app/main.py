"""FastAPI 应用入口。

统一约定：

- 所有响应都是 ``{"code": ..., "msg": "...", "data": ...}``；
- 成功时业务 ``code`` 恒为 200（HTTP 201 的注册响应同样是 200）；
- 失败时使用正确的 HTTP 状态码，并走同一套包络。
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.auth import router as auth_router
from app.api.v1.user import router as user_router
from app.core.config import settings
from app.core.responses import AppError, error_response
from app.db.session import engine
from app.schemas.auth import HealthResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="合规审查智能体 V3 后端：认证、会话与异步任务队列",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
    """业务异常。"""
    return error_response(exc.status_code, exc.msg, code=exc.code, data=exc.data)


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    """请求参数校验失败（422），同样走统一包络。"""
    details = []
    for error in exc.errors():
        location = ".".join(str(part) for part in error.get("loc", ())[1:]) or str(
            error.get("loc", ("",))[0]
        )
        details.append(
            {
                "field": location,
                "message": error.get("msg", ""),
                "type": error.get("type", ""),
            }
        )
    return error_response(422, "请求参数校验失败", data={"errors": details})


@app.exception_handler(StarletteHTTPException)
async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """框架抛出的 HTTP 异常。"""
    return error_response(exc.status_code, str(exc.detail))


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    """兜底异常处理，避免泄露堆栈。"""
    logger.exception("[app] 未处理的异常: %s %s", request.method, request.url.path)
    return error_response(500, "服务异常，请稍后重试")


app.include_router(auth_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")


@app.get("/health", response_model=dict, summary="健康检查")
async def health() -> dict:
    """服务健康状态。"""
    database_status = "ok"
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001 - 健康检查不应抛错
        logger.exception("[health] 数据库不可用")
        database_status = "error"

    payload = HealthResponse(
        status="ok" if database_status == "ok" else "degraded",
        database=database_status,
        version=app.version,
    )
    body = {
        "code": 200,
        "msg": "ok" if database_status == "ok" else "degraded",
        "data": payload.model_dump(by_alias=True),
    }
    return JSONResponse(status_code=200 if database_status == "ok" else 503, content=body)


__all__ = ["app"]
