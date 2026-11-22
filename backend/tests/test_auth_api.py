"""认证接口契约测试。

覆盖：注册成功、重复邮箱、登录成功、密码错误、未授权访问用户信息、
刷新后旧 token 失效、退出后当前 refresh token 失效，以及来源校验。
"""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.main import app
from tests.conftest import TEST_DISPLAY_NAME, TEST_EMAIL, TEST_PASSWORD


async def test_register_success(client: AsyncClient) -> None:
    """注册成功返回 HTTP 201，业务 code 仍为 200。"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "displayName": TEST_DISPLAY_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["code"] == 200
    assert payload["msg"] == "注册成功"
    assert payload["data"]["displayName"] == TEST_DISPLAY_NAME
    assert payload["data"]["email"] == TEST_EMAIL
    assert payload["data"]["id"] > 0


async def test_register_duplicate_email(client: AsyncClient) -> None:
    """重复邮箱返回 HTTP 409。"""
    body = {
        "displayName": TEST_DISPLAY_NAME,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    }
    first = await client.post("/api/v1/auth/register", json=body)
    assert first.status_code == 201

    second = await client.post("/api/v1/auth/register", json=body)
    assert second.status_code == 409
    assert second.json()["code"] == 409
    assert second.json()["msg"] == "该邮箱已被注册"


async def test_register_validation_error(client: AsyncClient) -> None:
    """参数校验失败返回统一包络 + HTTP 422。"""
    response = await client.post(
        "/api/v1/auth/register",
        json={"displayName": "a", "email": "not-an-email", "password": "short"},
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["code"] == 422
    assert payload["data"]["errors"]


async def test_login_success(client: AsyncClient) -> None:
    """登录成功返回非空 accessToken，并下发 refresh cookie。"""
    await client.post(
        "/api/v1/auth/register",
        json={
            "displayName": TEST_DISPLAY_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        },
    )

    response = await client.post(
        "/api/v1/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == 200
    assert payload["data"]["accessToken"]

    cookie_header = response.headers.get("set-cookie", "")
    assert "refresh_token=" in cookie_header
    assert "HttpOnly" in cookie_header
    assert "Path=/api/v1/auth" in cookie_header


async def test_login_wrong_password(client: AsyncClient) -> None:
    """密码错误返回 HTTP 401。"""
    await client.post(
        "/api/v1/auth/register",
        json={
            "displayName": TEST_DISPLAY_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        },
    )

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": TEST_EMAIL, "password": "WrongPassword@1"},
    )

    assert response.status_code == 401
    assert response.json()["msg"] == "邮箱或密码错误"


async def test_user_info_requires_token(client: AsyncClient) -> None:
    """未授权访问用户信息返回 HTTP 401。"""
    response = await client.get("/api/v1/user/info")

    assert response.status_code == 401
    assert response.json()["code"] == 401


async def test_user_info_with_token(logged_in_client: AsyncClient) -> None:
    """带 access token 可拿到用户信息。"""
    login = await logged_in_client.post(
        "/api/v1/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    access_token = login.json()["data"]["accessToken"]

    response = await logged_in_client.get(
        "/api/v1/user/info", headers={"Authorization": f"Bearer {access_token}"}
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == 200
    assert payload["data"]["email"] == TEST_EMAIL
    assert payload["data"]["displayName"] == TEST_DISPLAY_NAME


async def test_refresh_rotates_token(logged_in_client: AsyncClient) -> None:
    """刷新会轮换 refresh token：旧 token 立即失效，新 token 可用。"""
    old_cookie = logged_in_client.cookies.get("refresh_token")
    assert old_cookie

    refresh = await logged_in_client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 200
    new_access_token = refresh.json()["data"]["accessToken"]
    assert new_access_token
    new_cookie = logged_in_client.cookies.get("refresh_token")
    assert new_cookie and new_cookie != old_cookie

    # 旧 refresh token 已失效
    old_client = AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
        cookies={"refresh_token": old_cookie},
    )
    try:
        stale = await old_client.post("/api/v1/auth/refresh")
        assert stale.status_code == 401
        assert stale.json()["msg"] == "会话已失效，请重新登录"
    finally:
        await old_client.aclose()

    # 新 refresh token 可以继续续期
    again = await logged_in_client.post("/api/v1/auth/refresh")
    assert again.status_code == 200


async def test_logout_revokes_refresh_token(logged_in_client: AsyncClient) -> None:
    """退出后当前 refresh token 失效。"""
    logout = await logged_in_client.post("/api/v1/auth/logout")
    assert logout.status_code == 200
    assert logout.json()["code"] == 200

    refresh = await logged_in_client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 401

    # 支持重复调用
    again = await logged_in_client.post("/api/v1/auth/logout")
    assert again.status_code == 200


async def test_refresh_rejects_untrusted_origin(client: AsyncClient) -> None:
    """使用 Cookie 的写请求拒绝不可信来源。"""
    await client.post(
        "/api/v1/auth/register",
        json={
            "displayName": TEST_DISPLAY_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        },
    )
    await client.post(
        "/api/v1/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )

    response = await client.post(
        "/api/v1/auth/refresh", headers={"Origin": "http://evil.example.com"}
    )

    assert response.status_code == 403
    assert response.json()["msg"] == "请求来源不被信任"


async def test_health(client: AsyncClient) -> None:
    """健康检查返回服务与数据库状态。"""
    response = await client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == 200
    assert payload["data"]["status"] == "ok"
    assert payload["data"]["database"] == "ok"


async def test_auth_config_reports_registration_state(client: AsyncClient) -> None:
    """公开配置返回当前是否开放注册（默认环境开放）。"""
    response = await client.get("/api/v1/auth/config")

    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == 200
    assert payload["data"]["registrationEnabled"] is True


async def test_register_rejected_when_registration_disabled(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """注册关闭时，注册接口返回 HTTP 403。"""
    monkeypatch.setattr(settings, "registration_enabled", False)

    response = await client.post(
        "/api/v1/auth/register",
        json={
            "displayName": TEST_DISPLAY_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 403
    assert response.json()["code"] == 403
    assert response.json()["msg"] == "当前环境未开放注册"

    # 配置接口同步返回关闭状态
    config = await client.get("/api/v1/auth/config")
    assert config.json()["data"]["registrationEnabled"] is False
