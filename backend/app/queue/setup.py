"""初始化 Procrastinate 队列表。

在 Alembic 迁移之后执行一次即可。可以用 ``python -m app.queue.setup`` 调用。

注意：Procrastinate 的 ``apply_schema_async`` 只能作用于空库
（内部是 ``CREATE TYPE`` / ``CREATE TABLE``，不带 IF NOT EXISTS），
所以这里先判断队列表是否已存在，保证脚本可以重复执行
（Docker Compose 每次 ``up`` 都会跑一次迁移服务）。
"""

from __future__ import annotations

import asyncio
import logging

from app.queue.app import queue_app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_CHECK_SCHEMA_SQL = """
    SELECT to_regclass('public.procrastinate_jobs') IS NOT NULL AS jobs_exists,
           EXISTS (
               SELECT 1 FROM pg_type WHERE typname = 'procrastinate_job_status'
           ) AS type_exists
"""


async def setup() -> None:
    """创建 Procrastinate 需要的队列表（幂等）。"""
    async with queue_app.open_async() as app:
        state = await app.connector.execute_query_one_async(_CHECK_SCHEMA_SQL)
        if state.get("jobs_exists") and state.get("type_exists"):
            logger.info("[procrastinate] 队列表已存在，跳过初始化")
            return

        await app.schema_manager.apply_schema_async()

    logger.info("[procrastinate] 队列表初始化完成")


def main() -> None:
    asyncio.run(setup())


if __name__ == "__main__":
    main()
