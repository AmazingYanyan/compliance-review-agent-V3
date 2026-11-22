"""开发账号初始化命令。

用法::

    python -m app.scripts.create_dev_user --email demo@example.com
    python -m app.scripts.create_dev_user --email someone@example.com --password 'S3cret!'

固定演示密码只用于开发环境；生产环境会直接拒绝执行。
"""

from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.models import User
from app.db.session import AsyncSessionLocal
from app.schemas.auth import normalize_email

DEFAULT_DEMO_EMAIL = "demo@example.com"
DEFAULT_DEMO_PASSWORD = "Demo@12345"
DEFAULT_DISPLAY_NAME = "演示用户"


async def create_dev_user(email: str, password: str, display_name: str) -> None:
    """创建（或重置）一个开发账号。"""
    normalized_email = normalize_email(email)
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == normalized_email))
        user = result.scalar_one_or_none()

        if user is None:
            session.add(
                User(
                    display_name=display_name,
                    email=normalized_email,
                    password_hash=hash_password(password),
                    is_active=True,
                )
            )
            action = "创建"
        else:
            user.display_name = display_name
            user.password_hash = hash_password(password)
            user.is_active = True
            action = "重置"

        await session.commit()

    print(f"[dev-user] 已{action}开发账号：{normalized_email}（密码：{password}）")


def main() -> None:
    parser = argparse.ArgumentParser(description="初始化开发账号")
    parser.add_argument("--email", default=DEFAULT_DEMO_EMAIL, help="账号邮箱")
    parser.add_argument("--password", default=DEFAULT_DEMO_PASSWORD, help="账号密码")
    parser.add_argument("--display-name", default=DEFAULT_DISPLAY_NAME, help="显示名")
    args = parser.parse_args()

    if settings.is_production:
        raise SystemExit("生产环境禁止创建开发账号")

    asyncio.run(create_dev_user(args.email, args.password, args.display_name))


if __name__ == "__main__":
    main()
