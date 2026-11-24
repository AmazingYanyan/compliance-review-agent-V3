# HANDOFF

> 工作规则见 `AGENTS.md`。读取优先级：HANDOFF.md → HANDOFF_CODE.md → docs/ADP_MAP.md → 源码。
> 验收记录、阅读清单与待办归档在 `TEST_TODO.md`；关键取舍见 `DECISIONS.md`。

## 当前状态（CP7.5 · 交接质量修复）

- 已交付：认证后端（注册 / 登录 / 会话恢复 / 退出）、ADP 原生主布局、「我的任务」前端原型（列表 / 新建弹窗 / 核对工作台占位）。
- 路由：`/dashboard`（`Dashboard`）、`/tasks`（`TaskList`）、`/tasks/:taskId/workbench`（`TaskWorkbench`），均在 AppLayout 内且受保护；工作台靠 `meta.activePath='/tasks'` 让侧栏保持高亮「我的任务」，面包屑为「我的任务 / 工作台」。
- 任务数据全部来自前端模拟模块 `frontend/src/mock/tasks.ts`（sessionStorage 持久化：同标签页刷新保留，独立新会话回到种子样例）。状态口径：待核对 / 核对中 / 已完成；本轮仅新建「待核对」。
- 列表复用 ADP 的 `ArtSearchBar` + `ArtTable` + `ArtTableHeader`；企业名称子串匹配（忽略首尾空格）+ 状态筛选（全部 / 待核对 / 核对中 / 已完成）可组合并重置；工作台材料用 `ElTabs` 单内容区切换。
- i18n：`menus.tasks.*`（zh / en）已补。类型检查与构建通过（`vue-tsc --noEmit` 0 error，`pnpm build` 通过）。
- 干净克隆可构建：`src/types/import/auto-imports.d.ts` 已纳入版本管理（见 `DECISIONS.md` D29）。
- 未做（后续阶段）：后端任务与材料接口、真实文件上传、PDF 渲染、PaddleOCR、LLM、任务权限矩阵与双账号隔离。

## 运行方式

- 全栈：`docker compose up -d --build`（db:5433 → migrate → backend:8000 + worker）。
- 前端：`cd frontend && pnpm install --frozen-lockfile && pnpm dev` → http://localhost:3006
- 本机后端：`cd backend && .venv/bin/alembic upgrade head && .venv/bin/python -m app.queue.setup` → `.venv/bin/uvicorn app.main:app --port 8000`；worker：`.venv/bin/python -m app.queue.worker`。
- 开发账号：`.venv/bin/python -m app.scripts.create_dev_user --email demo@example.com`（`Demo@12345`）。
- 测试：`backend` 下 `.venv/bin/python -m pytest -q`（15 个用例，独立库 `compliance_test`，不需 worker）；`frontend` 下 `pnpm build`（= `vue-tsc --noEmit && vite build`）。

## API 契约（统一包络 `{code,msg,data}`，失败用真实 HTTP 状态码）

| 方法与路径 | 说明 |
| --- | --- |
| `GET /api/v1/auth/config` | 公开配置 → `data.registrationEnabled`（前端据此隐藏注册入口） |
| `POST /api/v1/auth/register` | 入参 `displayName/email/password` → 201；重复邮箱 409；注册关闭 403 |
| `POST /api/v1/auth/login` | 入参 `email/password` → `data.accessToken` + refresh Cookie；密码错 401 |
| `POST /api/v1/auth/refresh` | 读 Cookie 轮换 refresh → 新 `data.accessToken` |
| `POST /api/v1/auth/logout` | 撤销 refresh 会话并清 Cookie，可重复调用 |
| `GET /api/v1/user/info` | Bearer 鉴权 → `id/displayName/email` |
| `GET /health` | 服务与数据库状态 |

> 任务相关接口尚未定义，下一阶段在此表补充真实任务 API。

## 已知问题

- 退出只撤销 refresh 会话；已签发的 access token 在 15 分钟内仍可用（无黑名单，D6）。
- 开发账号密码固定，仅限本地；生产需替换 `JWT_SECRET` 并置 `COOKIE_SECURE=true`。
- 任务数据只存在浏览器 sessionStorage：换浏览器 / 无痕窗口 / 关闭标签页即回到种子样例（D20）；任务模块尚无权限矩阵与双账号隔离。
- 侧栏为本地静态菜单，接真实后端菜单时才需要 `RouteRegistry` / `MenuProcessor`（D2、D8）；顶栏「通知」红点待产品确认；`frontend/src/utils/constants/links.ts` 的 `WEB_LINKS` 已无引用者。
- 继承自上游：ADP 的 `build` 先跑 `vue-tsc` 而自动导入声明后生成，干净检出会失败；本工程用「声明文件入库」修复（D29），升级 vue/@vueuse/core/pinia 后需重新生成并提交。

## 索引

- 已读源码与调用关系：`HANDOFF_CODE.md`；验收记录 / 阅读清单 / 待办：`TEST_TODO.md`；取舍：`DECISIONS.md`；用法：`README.md`；上游结构：`docs/ADP_MAP.md`。
