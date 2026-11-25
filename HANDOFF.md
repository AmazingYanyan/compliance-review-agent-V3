# HANDOFF

> 工作规则见 `AGENTS.md`。读取优先级：HANDOFF.md → HANDOFF_CODE.md → docs/ADP_MAP.md → 源码；验收记录与阅读清单在 `TEST_TODO.md`，取舍见 `DECISIONS.md`。

## 当前状态（CP8.2 · 压缩核对工作台布局 + 真实 PDF 预览）

- 已交付：认证后端（注册 / 登录 / 会话恢复 / 退出）、ADP 原生主布局、「我的任务」前端原型、工作台材料 OCR 预览区、**压缩后的核对工作台 + 真实 PDF 预览**。
- 路由：`/dashboard`、`/tasks`（`TaskList`）、`/tasks/:taskId/workbench`（`TaskWorkbench`），均在 AppLayout 内且受保护；工作台靠 `meta.activePath='/tasks'` 保持侧栏高亮；面包屑为「我的任务 / 核对工作台」。
- 布局：顶部**紧凑任务栏**（企业名 + 客户类型 + 状态 + 任务编号 + 创建时间 + 返回按钮，桌面单行、窄屏换行；长企业名截断并用气泡显示全称），下方**一套**双栏预览区，桌面用满剩余视口高度、两栏各自滚动（已去掉旧的 `clamp(320px,52vh,560px)` 固定高度），390px 上下布局。
- 原文区按**材料格式**渲染：`image` 直接显示原图；`pages` 沿用 CP8.1 页图序列 + 手动翻页；`pdf` 用 `pdfjs-dist` 渲染真实 PDF（默认适应宽度、连续滚动、当前页/总页数、上一页/下一页、缩放），**Worker 用本地构建产物 `pdf.worker.min.mjs?url`**，开发与生产都可加载。
- 右侧识别文字与页图解耦（`getOcrPages`）：PDF 样例没有识别结果 → 显示「暂无识别结果」；切材料即清空上一份材料的文字与页码。
- 数据源仍是前端模拟：`frontend/src/mock/tasks.ts`（sessionStorage 键 `compliance-task-mock-v3`，材料新增 `format` / `source` 字段）+ `frontend/src/mock/previews.ts`。
- 样例原件由代码生成（`frontend/scripts/generate-sample-materials.mjs`，无头 Chrome 出图）：`frontend/public/samples/license-scan.png`（900×1400 合成营业执照）与 `frontend/public/samples/charter.pdf`（3 页合成章程，页码醒目）；两者挂在种子 `T2026001` 上（材料 `M2026001-1` PDF / `M2026001-4` PNG）。
- 附带项：新增 `frontend/src/assets/styles/core/hover.scss`，全局按钮 hover 反馈（上浮 1px + 阴影；文本型按钮只换背景），暗色模式跟随主题变量。
- 验证：`vue-tsc --noEmit` 0 error；`pnpm build` ✓；浏览器逐项验收全过（截图 `docs/screenshots/cp82-*`）；干净克隆构建与生产产物试跑记录在 `TEST_TODO.md`。
- 未做（后续阶段）：真实上传、PaddleOCR 接口与轮询、PDF 缩略图 / 旋转 / 批注、`bbox` 与区域高亮、检查项摘录与人工决定、数据库改动。

## 运行方式

- 全栈：`docker compose up -d --build`（db:5433 → migrate → backend:8000 + worker）；前端：`cd frontend && pnpm install --frozen-lockfile && pnpm dev` → http://localhost:3006
- 本机后端：`cd backend && .venv/bin/alembic upgrade head && .venv/bin/python -m app.queue.setup` → `.venv/bin/uvicorn app.main:app --port 8000`；worker：`.venv/bin/python -m app.queue.worker`。
- 开发账号：`.venv/bin/python -m app.scripts.create_dev_user --email demo@example.com`（`Demo@12345`）。
- 测试：`backend` 下 `.venv/bin/python -m pytest -q`；`frontend` 下 `pnpm build`（= `vue-tsc --noEmit && vite build`）；样例重生成 `node frontend/scripts/generate-sample-materials.mjs`。

## API 契约（统一包络 `{code,msg,data}`，失败用真实 HTTP 状态码）

| 方法与路径 | 说明 |
| --- | --- |
| `GET /api/v1/auth/config` | 公开配置 → `data.registrationEnabled` |
| `POST /api/v1/auth/register` | 入参 `displayName/email/password` → 201；重复邮箱 409；注册关闭 403 |
| `POST /api/v1/auth/login` | 入参 `email/password` → `data.accessToken` + refresh Cookie；密码错 401 |
| `POST /api/v1/auth/refresh` | 读 Cookie 轮换 refresh → 新 `data.accessToken` |
| `POST /api/v1/auth/logout` | 撤销 refresh 会话并清 Cookie，可重复调用 |
| `GET /api/v1/user/info` | Bearer 鉴权 → `id/displayName/email` |
| `GET /health` | 服务与数据库状态 |

> 任务与材料相关接口尚未定义，下一阶段在此表补充真实任务 API。

## 已知问题

- 样例原件与识别文字都是**合成数据**，不对应任何真实证照；`bbox`、真实页宽高、页码口径待接真实 OCR 后核对。
- PDF 预览只支持读（滚动 / 翻页 / 缩放），缩略图、旋转、批注、区域高亮留到后续；长 PDF 未做懒渲染与虚拟滚动。
- 退出只撤销 refresh 会话；已签发的 access token 在 15 分钟内仍可用（无黑名单，D6）。
- 开发账号密码固定，仅限本地；生产需替换 `JWT_SECRET` 并置 `COOKIE_SECURE=true`。
- 任务数据只存在浏览器 sessionStorage：换浏览器 / 无痕窗口即回到种子样例（D20）。
- 侧栏为本地静态菜单，接真实后端菜单时才需要 `RouteRegistry` / `MenuProcessor`（D2、D8）；顶栏「通知」红点待产品确认；继承自上游：`build` 先跑 `vue-tsc` 而自动导入声明后生成，本工程用「声明文件入库」修复（D29），升级 vue/@vueuse/core/pinia 后需重新生成并提交。

## 索引

- 已读源码与调用关系：`HANDOFF_CODE.md`；验收记录 / 阅读清单 / 待办：`TEST_TODO.md`；取舍：`DECISIONS.md`；用法：`README.md`；上游结构：`docs/ADP_MAP.md`。
