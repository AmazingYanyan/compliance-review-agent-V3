# 合规审查智能体 V3

合规审查智能体的工程起点。本轮交付范围：**登录、注册，以及用于验证认证链路的极简 `/dashboard`**。

- 前端：`frontend/` — 基于上游 [art-design-pro](https://github.com/Daymychen/art-design-pro)（Vue 3 + TypeScript + Vite + Element Plus + Tailwind CSS）
- 后端：`backend/` — FastAPI + Pydantic v2 + SQLAlchemy 2.x async + Alembic + PostgreSQL 18 + Argon2
- 队列：Procrastinate（与业务库同一个 PostgreSQL）

> 上游源码以原始提交 `f3aaf58eec1a0e988f162352c33862327a484f95` 导入，许可证与版权声明保留在 `frontend/LICENSE`。
> 详见 [DECISIONS.md](DECISIONS.md) 与 [HANDOFF.md](HANDOFF.md)。

## 快速开始

### 方式一：Docker Compose（推荐，一条命令起全栈）

```bash
cd 合规审查智能体V3
cp .env.example .env          # 可选：改端口 / JWT 密钥
docker compose up -d --build  # db(5433) + migrate + backend(8000) + worker
```

启动顺序由 Compose 编排保证：**db 健康检查通过 → migrate（Alembic 迁移 + Procrastinate 队列表初始化）成功退出 → backend / worker 启动**。

访问地址：

| 服务     | 地址                                        |
| -------- | ------------------------------------------- |
| 前端     | http://localhost:3006 （需另行启动前端，见下） |
| 后端 API | http://localhost:8000                       |
| 健康检查 | http://localhost:8000/health                |
| PostgreSQL | localhost:5433（user/pass/db 均为 compliance） |

前端开发服务（可选 profile）：

```bash
docker compose --profile frontend up -d frontend   # 容器内 Vite 代理指向 http://backend:8000
```

### 方式二：本机开发（前端 + 后端 + 数据库分别运行）

```bash
# 1) 数据库（PostgreSQL 18，宿主端口 5433）
docker run -d --name compliance-db -p 5433:5432 \
  -e POSTGRES_USER=compliance -e POSTGRES_PASSWORD=compliance -e POSTGRES_DB=compliance \
  postgres:18-alpine

# 2) 后端（Python 3.12，uv / venv）
cd backend
python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"
cp .env.example .env          # 或手动写 DATABASE_URL / PROCRASTINATE_DATABASE_URL
.venv/bin/alembic upgrade head          # 建表
.venv/bin/python -m app.queue.setup      # 初始化 Procrastinate 队列表（幂等）
.venv/bin/uvicorn app.main:app --reload --port 8000

# 3) 队列 worker（独立进程，并发 2）
.venv/bin/python -m app.queue.worker

# 4) 前端
cd ../frontend
pnpm install --frozen-lockfile
pnpm dev                     # http://localhost:3006
```

前端通过 Vite 代理把同源相对路径 `/api` 转发到 `VITE_API_PROXY_URL`（开发环境默认 `http://localhost:8000`），
浏览器只会看到一层 `/api` 前缀；refresh cookie 因此是同站 cookie。

### 数据库迁移

```bash
cd backend
.venv/bin/alembic upgrade head          # 应用迁移
.venv/bin/alembic revision --autogenerate -m "xxx"   # 新增迁移
```

### 运行测试

```bash
cd backend
.venv/bin/python -m pytest -q           # 13 个用例，独立测试库 compliance_test

cd ../frontend
pnpm build                              # vue-tsc --noEmit && vite build
```

测试使用独立的 PostgreSQL 库 `compliance_test`（由 `tests/conftest.py` 自动创建、迁移并初始化队列表），
不会影响开发库；也**不需要启动 worker**。

### 开发账号

```bash
cd backend
.venv/bin/python -m app.scripts.create_dev_user --email demo@example.com
```

- 默认账号：`demo@example.com` / `Demo@12345`（固定密码**仅用于开发**，生产环境脚本会直接拒绝执行）
- 开发环境默认开启注册：`REGISTRATION_ENABLED=true`；关闭后后端 `POST /api/v1/auth/register` 返回 403

### 环境变量

根目录 `.env.example` 是完整样例（后端读取 `backend/.env` 或进程环境变量；Compose 通过 `environment` 注入）。
关键项：

| 变量 | 说明 |
| ---- | ---- |
| `DATABASE_URL` | 业务库（SQLAlchemy asyncpg） |
| `PROCRASTINATE_DATABASE_URL` | 队列库（psycopg），与业务库同库不同连接串 |
| `JWT_SECRET` | access token 签名密钥，生产必须替换 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_EXPIRE_DAYS` | 默认 15 分钟 / 7 天 |
| `COOKIE_SAMESITE` / `COOKIE_SECURE` | 同源部署用 `lax`；HTTPS 跨站部署用 `none` + `true` |
| `REGISTRATION_ENABLED` | 注册开关，真正由后端执行 |
| `ALLOWED_ORIGINS` | 允许的前端来源，同时用于 Cookie 写请求的来源校验 |
| `VITE_API_PROXY_URL` / `VITE_PORT` | 前端代理目标与端口（默认 3006） |

## 目录结构

```
.
├── frontend/          # ADP 前端（上游基线 + 本轮改造）
├── backend/           # FastAPI 后端
│   ├── app/api/v1/    # 路由：auth / user
│   ├── app/services/  # 认证逻辑、注册事务
│   ├── app/queue/     # Procrastinate 任务、worker、队列表初始化
│   ├── alembic/       # 迁移脚本
│   └── tests/         # pytest 用例
├── docs/screenshots/  # 浏览器验收截图
├── docker-compose.yml # PostgreSQL 18 + backend + worker (+ frontend)
├── .env.example       # 环境变量样例
├── HANDOFF.md         # 交接说明（≤ 50 行）
├── DECISIONS.md       # 关键实现取舍
└── TEST_TODO.md       # 待补充的测试场景
```
