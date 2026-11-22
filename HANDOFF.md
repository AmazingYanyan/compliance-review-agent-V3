# HANDOFF

## 上游

- 仓库：https://github.com/Daymychen/art-design-pro
- 提交：`f3aaf58eec1a0e988f162352c33862327a484f95`（v3.0.2，2026-06-01）
- 导入路径：`frontend/`；未改造基线提交 `00c7e78`，改造提交见根仓库历史
- 工具版本：Node v24.14.0 / pnpm 10.32.1 / lockfile v9.0（上游无 `.nvmrc`、无 `packageManager`）

## 当前状态

- 本轮范围：注册、登录、退出、极简 `/dashboard`，前后端已打通真实 API + PostgreSQL 18。
- 已验证：浏览器全链路（注册 → 登录 → `/dashboard` → 刷新保持登录 → 退出 → 再次访问 `/dashboard` 回登录页）；
  错误密码、重复邮箱、两次密码不一致、未登录直接访问受保护页；桌面 1440 与窄屏 390 布局。
- 已验证：提交中按钮 loading + disabled、键盘 Tab 焦点环、错误密码提示为「邮箱或密码错误」。
- 已验证：`backend` 13 个 pytest 用例通过；`pnpm build`（含 `vue-tsc --noEmit`）0 error。
- 已验证：Procrastinate 欢迎任务在注册事务内投递，worker 独立消费成功；投递失败时注册整体回滚。
- 动态菜单 / 权限接口已从认证链路解耦；本轮只保留静态受保护路由。

## 运行方式

- 全栈：`docker compose up -d --build`（db:5433 → migrate → backend:8000 + worker）。
- 前端：`cd frontend && pnpm install --frozen-lockfile && pnpm dev` → http://localhost:3006。
- 本机后端：`cd backend && .venv/bin/alembic upgrade head && .venv/bin/python -m app.queue.setup`
  → `.venv/bin/uvicorn app.main:app --port 8000`；worker：`.venv/bin/python -m app.queue.worker`。
- 开发账号：`.venv/bin/python -m app.scripts.create_dev_user --email demo@example.com`（`Demo@12345`）。
- 测试：`cd backend && .venv/bin/python -m pytest -q`（独立库 `compliance_test`，不需 worker）。

## API 契约

统一包络 `{"code":200,"msg":"...","data":...}`；失败用真实 HTTP 状态码，422 为参数校验错误。

| 方法与路径 | 说明 |
| --- | --- |
| `POST /api/v1/auth/register` | 入参 `displayName/email/password` → 201；重复邮箱 409 |
| `POST /api/v1/auth/login` | 入参 `email/password` → `data.accessToken` + refresh Cookie；密码错 401 |
| `POST /api/v1/auth/refresh` | 读 Cookie 轮换 refresh → 新 `data.accessToken` |
| `POST /api/v1/auth/logout` | 撤销 refresh 会话并清 Cookie，可重复调用 |
| `GET /api/v1/user/info` | Bearer 鉴权 → `id/displayName/email` |
| `GET /health` | 服务与数据库状态 |

## 已知问题

- 退出只撤销 refresh 会话；**已签发的 access token 在 15 分钟内仍可用**（无黑名单，见 DECISIONS D6）。
- 开发账号密码固定，仅限本地；生产需替换 `JWT_SECRET` 并置 `COOKIE_SECURE=true`。
- Procrastinate 的 `apply_schema_async` 只适用于空库，初始化脚本已做幂等判断（见 DECISIONS D7）。
- 上游演示页面/动态菜单已删除，接入真实菜单时需重新引入 `RouteRegistry` / `MenuProcessor`（见 D2）。
