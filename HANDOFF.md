# HANDOFF

## 上游

- 仓库：https://github.com/Daymychen/art-design-pro
- 提交：`f3aaf58eec1a0e988f162352c33862327a484f95`（v3.0.2，2026-06-01）
- 导入路径：`frontend/`；未改造基线提交 `00c7e78`，改造提交见根仓库历史
- 工具版本：Node v24.14.0 / pnpm 10.32.1 / lockfile v9.0（上游无 `.nvmrc`、无 `packageManager`）

## 当前状态

- 本轮范围：修注册页版式、统一系统名称、移除演示浮层、`/dashboard` 接入 ADP 原生主布局、注册开关联动。
- `/dashboard` 现为「父路由 = `@views/index/index.vue`（AppLayout）+ 子路由 = `@views/dashboard/index.vue`」，
  侧栏/折叠/顶栏/面包屑/标签页全部复用上游组件；菜单由本地静态路由 `staticMenuList` 提供，当前只有「工作台」。
- 账号信息与退出已移入右上角头像菜单；退出走 `userStore.signOut()` → 真实 `POST /api/v1/auth/logout`。
- 注册页版式已修复：恢复上游基线的 `@import '../login/style.css'`（此前丢失导致输入框横向铺满、标题贴顶）。
- 已移除交付界面的上游演示件：右下角机器人（chat-window）、顶栏聊天入口、底部开发浮层（fast-enter）、设置引导气泡。
- 已验证：浏览器全链路（注册 → 登录 → 工作台 → 刷新保持登录 → 头像菜单退出 → 未登录访问 `/dashboard` 回登录页）。
- 已验证：退出时确实发出 `POST /api/v1/auth/logout`；注册页三状态（首次打开无红框 / 空提交 / 输入纠错）表单均保持对齐。
- 已验证：桌面 1440 与窄屏 390 布局；窄屏侧栏默认收起、点击菜单按钮展开为 230px 覆盖层；内容区无横向溢出。
- 已验证：`backend` 15 个 pytest 用例通过；`pnpm build`（含 `vue-tsc --noEmit`）0 error。
- 截图见 `docs/screenshots/cp6-*.png`（登录/注册/工作台 × 桌面 1440 / 窄屏 390）。

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
| `GET /api/v1/auth/config` | 公开配置 → `data.registrationEnabled`（前端据此隐藏注册入口） |
| `POST /api/v1/auth/register` | 入参 `displayName/email/password` → 201；重复邮箱 409；注册关闭 403 |
| `POST /api/v1/auth/login` | 入参 `email/password` → `data.accessToken` + refresh Cookie；密码错 401 |
| `POST /api/v1/auth/refresh` | 读 Cookie 轮换 refresh → 新 `data.accessToken` |
| `POST /api/v1/auth/logout` | 撤销 refresh 会话并清 Cookie，可重复调用 |
| `GET /api/v1/user/info` | Bearer 鉴权 → `id/displayName/email` |
| `GET /health` | 服务与数据库状态 |

## 已知问题

- 退出只撤销 refresh 会话；**已签发的 access token 在 15 分钟内仍可用**（无黑名单，见 DECISIONS D6）。
- 开发账号密码固定，仅限本地；生产需替换 `JWT_SECRET` 并置 `COOKIE_SECURE=true`。
- Procrastinate 的 `apply_schema_async` 只适用于空库，初始化脚本已做幂等判断（见 DECISIONS D7）。
- 侧栏菜单目前为本地静态列表，接真实后端菜单时才需要 `RouteRegistry` / `MenuProcessor`（见 D2、D8）。
- 顶栏「通知」按钮仍带上游演示红点，是否保留待产品确认。

## 代码索引

见 `HANDOFF_CODE.md`（已读源码的作用、调用关系、需修改位置）。
