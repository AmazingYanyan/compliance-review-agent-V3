# 合规审查智能体 V3

合规审查智能体的工程起点。当前交付范围：**登录、注册、接入 ADP 原生主布局的工作台，以及「我的任务」前端原型**。

- 前端：`frontend/` — 基于上游 [art-design-pro](https://github.com/Daymychen/art-design-pro)（Vue 3 + TypeScript + Vite + Element Plus + Tailwind CSS）
- 后端：`backend/` — FastAPI + Pydantic v2 + SQLAlchemy 2.x async + Alembic + PostgreSQL 18 + Argon2
- 队列：Procrastinate（与业务库同一个 PostgreSQL）

> 上游源码以原始提交 `f3aaf58eec1a0e988f162352c33862327a484f95` 导入，许可证与版权声明保留在 `frontend/LICENSE`。
> 详见 [DECISIONS.md](DECISIONS.md) 与 [HANDOFF.md](HANDOFF.md)。已读源码索引见 [HANDOFF_CODE.md](HANDOFF_CODE.md)。

## 当前功能

### 认证（真实后端）

| 能力 | 说明 |
| ---- | ---- |
| 注册 | 显示名 / 邮箱 / 密码；后端做去重、强度与邮箱规范化；可用 `REGISTRATION_ENABLED` 关闭 |
| 登录 | 邮箱 + 密码；access token 仅存前端内存，refresh token 走 HttpOnly Cookie |
| 会话恢复 | 刷新页面后用 refresh cookie 换新 access token |
| 退出 | 撤销 refresh 会话并清 Cookie（幂等） |
| 路由保护 | 除登录 / 注册 / 错误页外均需登录 |

### 「我的任务」（前端模拟数据原型）

本轮任务数据全部来自前端模拟模块 `frontend/src/mock/tasks.ts`（sessionStorage 持久化），**尚未接入后端接口**。

| 能力 | 说明 |
| ---- | ---- |
| 列表 | 企业名称、客户类型、任务状态、创建时间与主操作；企业名称按子串匹配（忽略首尾空格） |
| 筛选 | 任务状态：全部 / 待核对 / 核对中 / 已完成；可与关键词组合，支持重置 |
| 状态口径 | 待核对（创建即入）→ 核对中（首次保存人工核对决定）→ 已完成（完成操作）；本轮仅新建「待核对」 |
| 新建任务 | 企业名称与客户类型必填；新任务独立 ID、实际创建时间、置顶列表 |
| 核对工作台 | 按任务 ID 加载，展示企业名称、客户类型、状态与材料；材料在同一内容区切换 |
| 返回 | 从工作台返回列表时，搜索词与状态筛选一并恢复 |

> 任务数据只保存在当前浏览器标签页：刷新保留，换标签页或换浏览器回到种子样例。

### 路由

| 路径 | 路由名 | 说明 |
| ---- | ---- | ---- |
| `/auth/login` | `Login` | 登录 |
| `/auth/register` | `Register` | 注册 |
| `/dashboard` | `Dashboard` / `DashboardWorkbench` | 工作台（AppLayout 内） |
| `/tasks` | `TaskList` | 我的任务列表（AppLayout 内） |
| `/tasks/:taskId/workbench` | `TaskWorkbench` | 核对工作台（AppLayout 内，侧栏保持高亮「我的任务」） |
| `/403` `/500` `/:pathMatch(.*)*` | — | 错误页 |

## 快速开始

### 方式一：Docker Compose（推荐，一条命令起全栈）

```bash
cd 合规审查智能体V3
cp .env.example .env          # 可选：改端口 / JWT 密钥
docker compose up -d --build  # db(5433) + migrate + backend(8000) + worker
```

启动顺序由 Compose 编排保证：**db 健康检查通过 → migrate（Alembic 迁移 + Procrastinate 队列表初始化）成功退出 → backend / worker 启动**。

> 构建镜像较慢时可用国内镜像源：`PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple docker compose up -d --build`。

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
  -v compliance-pgdata:/var/lib/postgresql \
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
.venv/bin/python -m pytest -q           # 15 个用例，独立测试库 compliance_test

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
- 开发环境默认开启注册：`REGISTRATION_ENABLED=true`；关闭后后端 `POST /api/v1/auth/register` 返回 403，
  前端同步隐藏登录页的「注册」入口并拦截直接访问 `/auth/register`

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
│   └── src/
│       ├── mock/tasks.ts       # 任务模拟数据模块（sessionStorage 持久化）
│       └── views/tasks/        # 我的任务：list/ + workbench/
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
├── HANDOFF_CODE.md    # 已读源码索引：作用、调用关系、需修改位置
├── DECISIONS.md       # 关键实现取舍
└── TEST_TODO.md       # 待补充的测试场景
```
