# HANDOFF

> 工作规则见 `AGENTS.md`，开工前先读。文件读取优先级：HANDOFF.md → HANDOFF_CODE.md → docs/ADP_MAP.md → 源码。

## 当前状态（CP7 · 我的任务原型）

- 本轮范围：在 CP6 主布局基础上交付「我的任务」列表、新建任务弹窗、核对工作台占位页。
- 路由：新增 `/tasks`（`TaskList`）与 `/tasks/:taskId/workbench`（`TaskWorkbench`），均为 AppLayout 的业务子页，
  受保护（未登录由守卫引导登录），侧栏只新增「我的任务」一项；工作台通过 `meta.activePath = '/tasks'` 让侧栏保持高亮。
- 数据：全部走前端模拟模块 `frontend/src/mock/tasks.ts`（sessionStorage 持久化，同标签页刷新保留，独立新会话回到种子样例）。
  任务状态口径：待核对 / 核对中 / 已完成；本轮仅新建「待核对」，另两种状态由种子样例提供。
- 列表：企业名称（子串匹配、忽略首尾空格）+ 任务状态（全部/待核对/核对中/已完成）可组合筛选并支持重置；
  表格复用 ADP 的 `ArtSearchBar` + `ArtTable` + `ArtTableHeader`；三种状态分别展示「开始 / 继续核对 / 查看」。
- 新建任务：`ElDialog` 表单，企业名称与客户类型必填；创建后独立 ID、实际创建时间、置顶列表；
  若当前筛选会隐藏新任务则自动清除企业名称与状态筛选并提示。
- 工作台：展示企业名称、客户类型、任务状态与「返回我的任务」入口；材料用 `ElTabs` 单内容区替换显示，
  公司章程为核对占位，其他材料提示「本轮暂未开放核对」；未知任务 ID 显示提示与返回入口。
- i18n：`menus.tasks.*`（zh / en）已补。
- 状态：代码与类型检查已通过（`vue-tsc --noEmit` 0 error，`pnpm build` 通过）；**浏览器逐项验收尚未完成**（见「本轮验收进度」）。

## 本轮验收进度（mark 点）

已实测：

- 注册 → 登录 → 进入工作台，路由与布局正常（登录链路沿用 CP6 的真实后端）。

待完成（下一轮继续，不要重复已完成项）：

1. 侧栏出现「我的任务」，点击进入列表。
2. 新建任务 → 列表顶部立即出现；刷新列表后仍在。
3. 「开始」进入工作台：任务仍为待核对、显示「尚未上传公司章程」提示；刷新工作台后返回列表，路由与数据一致。
4. 样例任务「继续核对」：同一内容区切换两份材料；已完成任务「查看」：只读态。
5. 搜索与筛选：企业名称子串、四个状态、组合查询、重置、空结果提示；筛选隐藏新任务时的创建反馈。
6. 未知任务 ID 的返回路径。
7. 1440px 与 390px 布局检查（侧栏、列表、创建表单、工作台、返回入口；窄屏无横向溢出）。
8. 关键路径控制台无新增错误、网络请求无意外失败。
9. 截图存入 `docs/screenshots/`（桌面/窄屏 × 列表/创建表单/章程缺失/多材料/未知 ID/只读态）。

## 本阶段计划读取的文件清单（CP7 · 已完成）

> 规则：清单外文件默认不读；确需读取时先在此写明原因与预计数量。

| # | 文件 | 预计读法 | 目的 |
| - | ---- | -------- | ---- |
| 1 | `frontend/src/components/core/tables/art-table/index.vue` | 读 Props/插槽/分页段 | 复用表格组件 |
| 2 | `frontend/src/components/core/forms/art-search-bar/index.vue` | 读 Props/modelValue/Expose | 复用搜索栏 |
| 3 | `frontend/src/hooks/core/useTable.ts` | 读整体（<500 行则全读） | 表格数据加载 hook |
| 4 | `frontend/src/components/core/forms/art-button-table/index.vue` | 读 Props | 确认是否需要 |
| 5 | `frontend/src/components/core/forms/art-form/index.vue` | 读 Props | 表单组件可用性 |
| 6 | 上游 `src/views/examples/tables/basic.vue`（git show 00c7e78） | 读模板与 script | 复用上游表格页范式 |
| 7 | 上游 `src/views/system/user/index.vue` + `modules/user-search.vue` + `modules/user-dialog.vue`（git show 00c7e78） | 读模板/数据流 | 复用「搜索栏 + 表格 + 弹窗」范式 |
| 8 | `frontend/src/router/routes/staticRoutes.ts` | 读全文 | 新增两条路由 |
| 9 | `frontend/src/router/guards/beforeEach.ts` | 读全文 | 确认受保护路由写法 |
| 10 | `frontend/src/store/modules/worktab.ts` | 读 openTab/removeTab 段 | 标签页行为 |
| 11 | `frontend/src/utils/navigation/route.ts` | 读全文 | 菜单项字段约定 |
| 12 | `frontend/src/types/router/index.ts` | 读全文 | `AppRouteRecord` 类型 |
| 13 | `frontend/src/locales/langs/zh.json` / `en.json` | 读 `menus` 段 | 菜单标题 i18n |
| 14 | `frontend/src/hooks/core/useTableColumns.ts` | 读 columns/columnChecks 段 | 表格列配置 |
| 15 | `frontend/src/components/core/layouts/art-menus/art-sidebar-menu/widget/SidebarSubmenu.vue` | 读全文 | 菜单项过滤规则 |

实际新增文件（本工程自建，不属于读取清单）：

- `frontend/src/mock/tasks.ts` —— 任务模拟数据 + sessionStorage 持久化 + 筛选条件存取。
- `frontend/src/views/tasks/list/index.vue` —— 我的任务列表（`TaskList`）。
- `frontend/src/views/tasks/list/modules/task-search.vue` —— 搜索栏（封装 `ArtSearchBar`）。
- `frontend/src/views/tasks/list/modules/task-create-dialog.vue` —— 新建任务弹窗。
- `frontend/src/views/tasks/workbench/index.vue` —— 核对工作台占位页（`TaskWorkbench`）。

---

## 上游

- 仓库：https://github.com/Daymychen/art-design-pro
- 提交：`f3aaf58eec1a0e988f162352c33862327a484f95`（v3.0.2，2026-06-01）
- 导入路径：`frontend/`；未改造基线提交 `00c7e78`，改造提交见根仓库历史
- 工具版本：Node v24.14.0 / pnpm 10.32.1 / lockfile v9.0（上游无 `.nvmrc`、无 `packageManager`）

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

> 任务相关接口尚未定义，本轮全部走前端模拟模块；下一阶段在此表补充真实任务 API。

## 已知问题

- 退出只撤销 refresh 会话；**已签发的 access token 在 15 分钟内仍可用**（无黑名单，见 DECISIONS D6）。
- 开发账号密码固定，仅限本地；生产需替换 `JWT_SECRET` 并置 `COOKIE_SECURE=true`。
- Procrastinate 的 `apply_schema_async` 只适用于空库，初始化脚本已做幂等判断（见 DECISIONS D7）。
- 侧栏菜单目前为本地静态列表，接真实后端菜单时才需要 `RouteRegistry` / `MenuProcessor`（见 D2、D8）。
- 顶栏「通知」按钮仍带上游演示红点，是否保留待产品确认。
- 任务数据只存在浏览器 sessionStorage：换浏览器 / 无痕窗口 / 关闭标签页即回到种子样例，跨设备不共享（本轮为原型，见 DECISIONS D20）。
- 任务模块尚未做权限矩阵与双账号隔离，同一浏览器标签页内所有账号看到同一份模拟数据。

## 代码索引

见 `HANDOFF_CODE.md`（已读源码的作用、调用关系、需修改位置）。
