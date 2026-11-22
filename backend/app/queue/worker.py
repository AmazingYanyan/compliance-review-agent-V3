"""Procrastinate worker 入口。

独立进程运行：``python -m app.queue.worker``，并发数由
``PROCRASTINATE_CONCURRENCY`` 控制（默认 2）。
"""

from __future__ import annotations

import asyncio
import logging

from app.core.config import settings
from app.queue.app import queue_app

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


async def run_worker() -> None:
    """启动 worker。"""
    logger.info(
        "[procrastinate] worker 启动，并发数=%s", settings.procrastinate_concurrency
    )
    async with queue_app.open_async() as app:
        await app.run_worker_async(concurrency=settings.procrastinate_concurrency)


def main() -> None:
    asyncio.run(run_worker())


if __name__ == "__main__":
    main()
