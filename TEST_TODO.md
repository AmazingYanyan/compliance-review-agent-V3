# TEST TODO

后端已覆盖的场景见 `backend/tests/`（15 个用例，全部通过）。以下场景留待后续迭代补充。

## 已覆盖

- [x] 注册成功（HTTP 201 / 业务 code 200）、重复邮箱（409）、参数校验错误（422）
- [x] 登录成功（accessToken + refresh Cookie）、密码错误（401）
- [x] 未授权访问 `/api/v1/user/info`（401）、带 token 正常返回
- [x] 刷新轮换 refresh token 后旧 token 失效（401）
- [x] 退出后当前 refresh token 失效（401）、退出可重复调用
- [x] Cookie 写请求的来源校验（不可信 Origin → 403）
- [x] 欢迎任务投递失败时注册整体回滚（另一条连接断言用户不存在）
- [x] 正常注册落库且欢迎任务进入队列
- [x] `/health` 服务与数据库状态
- [x] `GET /api/v1/auth/config` 返回注册开关状态（默认开放）
- [x] `REGISTRATION_ENABLED=false` 时注册接口返回 403，且 config 同步返回关闭

## 认证 / 会话

- [ ] 并发请求同时触发 401 时，确认只发生一次 refresh，且每个原请求最多重试一次（需补并发测试）。
- [ ] access token 过期后使用 refresh cookie 恢复会话的端到端场景（需构造过期 token）。
- [ ] refresh token 轮换后，旧 refresh token 重复使用的幂等/拒绝行为（当前仅覆盖「旧 token 失效」）。
- [ ] 退出后旧 access token 在有效期内仍可访问 `/api/v1/user/info` 的显式回归测试。
- [ ] Cookie `SameSite=None` + `Secure` 的跨站部署形态验证。
- [ ] 登录失败次数限流 / 账号锁定策略。

## 注册

- [ ] 并发注册同一邮箱时，唯一约束冲突（409）的实际并发表现。
- [ ] 显示名长度上限、包含空白字符的显示名等边界值。
- [ ] 密码强度规则（大小写 / 数字 / 特殊字符）收紧后的用例。
- [x] `REGISTRATION_ENABLED=false` 时前端入口隐藏与后端 403 的联动
      （前端：`useAuthStore.registrationEnabled` 控制登录页入口隐藏 + 守卫拦截注册路由；
      后端：register 403；浏览器手动复验待补 `REGISTRATION_ENABLED=false` 环境的实跑截图）。

## 队列

- [ ] worker 崩溃重启后的任务重试与死信处理。
- [ ] 任务幂等性（同一用户重复投递 welcome 任务）。
- [ ] 队列积压时的 worker 并发调优。
- [ ] Procrastinate 版本升级后官方迁移脚本的应用流程。

## 我的任务（CP7）

代码已实现，`vue-tsc --noEmit` 与 `pnpm build` 均通过；浏览器逐项验收已完成（Chrome 1440px / 390px 实跑）。

### 已验收

- [x] 登录后侧栏出现「我的任务」，点击进入列表页。
- [x] 未登录直接访问 `/tasks` 与 `/tasks/:taskId/workbench`，被守卫引导到登录页（`/auth/login?redirect=...`）。
- [x] 新建任务：企业名称与客户类型必填校验、取消不新增、连续点击不重复创建。
      —— **验收中发现缺陷并已修复**：原实现把 `submitting` 锁放在 `await validate()` 之后，连击两次会创建两条任务；
      已改为「先上锁再校验」（`task-create-dialog.vue` 的 `handleSubmit`）。
- [x] 新建后列表顶部立即出现该任务；刷新列表后仍在（sessionStorage 持久化）。
- [x] 新任务状态为「待核对」，无材料时工作台显示「尚未上传公司章程」+「该任务尚未上传任何材料」。
- [x] 三种状态分别显示「开始 / 继续核对 / 查看」，点击进入同一工作台组件。
- [x] 「继续核对」样例任务：同一内容区可切换「公司章程」与「财务报表」，当前材料有选中态（同一时刻仅 1 个面板可见）。
- [x] 已完成任务进入工作台为只读态（带「只读」标签，只提供材料切换与「返回我的任务」）。
- [x] 未知任务 ID 显示「任务不存在」提示与返回列表入口。
- [x] 企业名称子串搜索（忽略首尾空格，`"  华信  "` → 命中「华信资本管理有限公司」）、四个状态筛选、组合查询、重置。
- [x] 无结果时显示「未找到符合条件的任务」+ 重置筛选入口；无任务时显示「暂无任务」+ 新建入口。
- [x] 当前筛选会隐藏新任务时，创建后自动清除筛选并提示「已清除筛选条件，可直接查看新任务」。
- [x] 从工作台返回列表后，搜索词与状态筛选恢复，列表结果一致。
- [x] 刷新工作台页面后返回列表，筛选条件仍在（sessionStorage 持久化）。
- [x] 切换任务后顶部标签页标题与页面内容都更新为当前任务（标签标题显示企业名称），不残留上一条信息。
- [x] 1440px 与 390px 检查：侧栏、列表、创建表单、工作台、返回入口；窄屏无横向溢出
      （`documentElement.scrollWidth == clientWidth`，表格自身横向滚动）。
- [x] 关键路径控制台无新增错误，网络请求无意外失败（`Runtime.consoleAPICalled` / `Log.entryAdded` / `Network.loadingFailed` 均无记录）。
- [x] 截图存入 `docs/screenshots/`：`cp7-{task-list,task-create,workbench-no-charter,workbench-multi-material,workbench-unknown-id,workbench-completed-readonly}-{desktop,narrow}.png`（共 12 张）。
- [x] 键盘：Tab 顺序（企业名称 → 任务状态 → 重置 → 查询 → 新建任务 → 表格工具 → 行内操作），
      焦点有可见轮廓；`Esc` 可关闭新建任务弹窗。

### 未覆盖 / 已知限制

- [ ] 输入框内按 `Enter` 直接提交新建任务表单（当前需点「创建」按钮）。
- [ ] 窄屏下侧栏展开态截图（仅验证了默认收起态与无横向溢出）。

### 后续迭代（接后端后）

- [ ] 真实任务接口的分页、排序、错误提示与重试。
- [ ] 人工核对决定的保存：原文 / 摘录 / 出处 / 接受或拒绝（拒绝需填原因）。
- [ ] 状态流转 `pending → in_review → completed` 的端到端用例。
- [ ] 任务权限矩阵与双账号隔离（同标签页内不同账号的任务可见范围）。
- [ ] 材料上传、OCR 处理中 / 缺材料 / 提取失败 / 覆盖不全等工作台内部状态的展示。
- [ ] sessionStorage 容量上限触发后的降级策略。

## 交接质量修复（CP7.5）

### 修复项

- [x] **干净检出不构建**：`frontend/src/types/import/auto-imports.d.ts` 被 `.gitignore` 排除，
      而 `build` 脚本先跑 `vue-tsc --noEmit` → 干净克隆第一步报 TS2304（`Cannot find name 'ref'/'computed'/'watch'` 等 316 条）直接失败。
      方案：把该声明文件**纳入版本管理**并从 `.gitignore` 移除（`components.d.ts` 仍忽略）。
      实测：`components.d.ts` 对 `vue-tsc --noEmit` **非必需**（删除后类型检查仍 0 error），
      `auto-imports.d.ts` 是必需项，且其内容为 **preset 全量声明（304 项，含未使用的 `useDark`/`useTemplateRef` 等）**，
      与业务代码无关 → 日常开发不会使其变旧，仅在升级 vue/@vueuse/core/pinia 时需重新生成。
      理由与代价见 `DECISIONS.md` D29。
- [x] **文档纠错**：`README.md` 本机开发章节的 `cp .env.example .env` → `cp ../.env.example .env`；
      `HANDOFF_CODE.md` 测试库口径「ASGITransport + 内存库」→ 「ASGITransport + 独立 PostgreSQL 测试库 `compliance_test`」；
      `HANDOFF_CODE.md` 菜单项路径 `/task/list/index` → `/tasks/list/index`。
- [x] **全文检索同类错误**：脚本抽取 6 份文档中所有反引号路径并逐一核对存在性；
      除上述三处外，其余不存在的路径全部是**已注明的上游文件**（`src/views/examples/**`、`src/views/system/**`，
      本工程已删除，需 `git show 00c7e78:...` 查看），无新增错误。pytest 用例数核对为 15，与文档一致。
- [x] **`HANDOFF.md` ≤ 50 行**：`wc -l` = 48。CP7 验收记录、CDP 排障细节、阅读计划清单已归档到本文件；
      `DECISIONS.md` 补 D30（阅读清单规则与「同文件不重复读取」规则在长会话下的冲突与可持续做法）。

### 干净克隆验收

验收目录 `/tmp/v3-clean-verify`（`git clone` 自本仓库，克隆自提交 `d32ba11`；无 `node_modules` 复用，依赖真实安装）：

| 命令 | 退出码 | 关键输出 |
| --- | --- | --- |
| `git clone <repo> /tmp/v3-clean-verify` | 0 | `frontend/src/types/import/auto-imports.d.ts` 已随克隆到位（21137 B）；`frontend/node_modules` 不存在 |
| `pnpm install --frozen-lockfile` | **0** | `Done in 3.6s using pnpm v10.32.1`（warning：`prepare > husky` 提示 `.git can't be found`，因为 husky 在 `frontend/` 子目录找 `.git`，无害；另有 pnpm 10 默认拦截 esbuild 等 postinstall 的提示，不影响构建） |
| `pnpm build` | **0** | `> vue-tsc --noEmit && vite build` → 类型检查 0 error → `✓ built in 8.57s`，产出 `dist/`（含 `assets/tasks-sSf0f12g.js` 等 91 个 chunk、`index.html`、`favicon.ico`） |

附加核对：

- 构建后 `git status --short` **为空** —— 生成内容确定性成立，构建不会留下脏文件。
- 干净克隆生成的 `auto-imports.d.ts` 与仓库入库版本 **逐字节一致**。
- 修复前对照（同一 clone、`d32ba11` 之前的状态）：`vue-tsc --noEmit` 报 316 条错误，
  全部为 `TS2304 Cannot find name 'computed' / 'ref' / 'watch' …` 及其连带 `TS7006`。

## 归档：阅读计划（AGENTS.md 规则）

> 规则要求：每阶段开始前把计划读取的文件清单写入 `HANDOFF.md`（≤15 个），阶段结束后归档到 `TEST_TODO.md`。

### CP7（我的任务原型）· 实际读取 15 个

`frontend/src/components/core/tables/art-table/index.vue`、`frontend/src/components/core/forms/art-search-bar/index.vue`、
`frontend/src/hooks/core/useTable.ts`、`frontend/src/components/core/forms/art-button-table/index.vue`、
`frontend/src/components/core/forms/art-form/index.vue`、上游 `src/views/examples/tables/basic.vue`（`git show 00c7e78`）、
上游 `src/views/system/user/{index.vue,modules/user-search.vue,modules/user-dialog.vue}`（`git show 00c7e78`）、
`frontend/src/router/routes/staticRoutes.ts`、`frontend/src/router/guards/beforeEach.ts`、
`frontend/src/store/modules/worktab.ts`、`frontend/src/utils/navigation/route.ts`、
`frontend/src/types/router/index.ts`、`frontend/src/locales/langs/{zh.json,en.json}`、
`frontend/src/hooks/core/useTableColumns.ts`、
`frontend/src/components/core/layouts/art-menus/art-sidebar-menu/widget/SidebarSubmenu.vue`。

### CP7.5（交接质量修复）· 实际读取 13 个

`frontend/package.json`、`frontend/.gitignore`、`frontend/vite.config.ts`（AutoImport/Components 段）、
`frontend/tsconfig.json`、`frontend/src/types/import/auto-imports.d.ts`、`frontend/src/types/import/components.d.ts`、
根 `.gitignore`、`backend/tests/conftest.py`、`README.md`、`HANDOFF.md`、`HANDOFF_CODE.md`、`TEST_TODO.md`、`DECISIONS.md`。

上游对照（`git show 00c7e78:frontend/package.json` 与 `frontend/.gitignore`）：与当前工程一致 → 干净检出构建失败**继承自上游 ADP**。

### CP8.1（OCR 材料预览原型）· 实际读取 6 个

`frontend/src/mock/tasks.ts`、`frontend/src/views/tasks/workbench/index.vue`、
`frontend/src/mock/previews.ts`（本轮新建）、`frontend/src/utils/sys/error-handle.ts`（排查 `[ResourceError]` 来源）、
`HANDOFF.md` / `HANDOFF_CODE.md`（读 + 追加）。

计划清单原列 8 项，其中 2 项未读且不再需要：
`frontend/src/views/tasks/list/index.vue`（三态入口文案本轮未改）、`frontend/src/locales/langs/{zh,en}.json`（本轮未新增 i18n 文案）。
另有 1 项计划外读取：`frontend/src/types/import/auto-imports.d.ts`（确认 `nextTick` 是否自动导入）与
`frontend/src/assets/styles/core/tailwind.css`（确认 `--art-gray-*` 变量存在）—— 均为定点检索，未全文读。

## 归档：浏览器验收工具链（CP7）

本机 **chrome-devtools MCP 的数值参数失效**：Trae 桥接层把数字序列化成字符串，
`evaluate_script` / `take_screenshot` / `resize_page` / `click` / `navigate_page` 全部报 `root.pageId: must be number`
（`list_pages` 因无参数可用）。本轮改用**原生 CDP 直连**：

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9333 --user-data-dir=/tmp/cp7/profile2 \
  --window-size=1440,900 "http://localhost:3006/#/auth/login"
# 用 WebSocket 连 http://127.0.0.1:9333/json/list 里的 page target
```

踩坑记录：

- `Emulation.setDeviceMetricsOverride` **只在当前 CDP 会话内生效**，会话断开即还原 → 视口切换与截图必须在**同一会话**内完成。
- 合成点击要派发 `pointerdown/mousedown/pointerup/mouseup/click` 全套（Element Plus 依赖 pointer 事件）。
- 判断 Element Plus 弹层是否可见用 `getComputedStyle(el).display !== 'none'`；
  `offsetParent` 对 `position: fixed` 元素恒为 `null`，不可用。
- 按文本点击要取**最内层**匹配元素，否则会点到外层包装 div，事件不会落到按钮上（表现为「点了没反应」）。
- 未登录场景用 `Target.createBrowserContext` + `Target.createTarget` 造独立上下文，不污染当前登录态。
- Chrome 必须以后台方式启动（`run_in_background`），随 shell 退出一起被杀会导致 CDP 端口消失。

CP8.1 补充的坑：

- **只改 hash 属于同文档导航**，不会重新加载应用 → 上一个页面的组件状态、控制台报错都会残留。
  验收脚本里 `Page.navigate` 后要跟一次 `Page.reload`，否则会误判「控制台有错误」。
- 应用启动会**恢复上次访问的标签页**（worktab 持久化在 localStorage）→ 整页重载后 hash 可能被覆盖成上次的路由。
  `goto` 需在重载后校验 `location.href`，不一致时再导航一次（最多 4 次）。
- `<img src="data:image/svg+xml,...">` 必须是**完整 SVG 文档**（含根 `<svg xmlns width height viewBox>`），
  否则 `decode()` 抛 `EncodingError`，图片渲染为空 alt 文本（高度 24px），并被应用自己的
  `registerResourceErrorHandler`（`frontend/src/utils/sys/error-handle.ts`）打成 `[ResourceError]` 控制台错误。

## OCR 材料预览（CP8.1）

代码已实现，`vue-tsc --noEmit` 与 `pnpm build` 均通过；浏览器逐项验收已完成（Chrome 1440px / 390px 实跑，22 项全过）。

### 已验收

- [x] **无材料空态**（种子 `T2026002`）：显示「该任务尚未上传任何材料」，无预览区，保留「返回我的任务」入口。
- [x] **从列表进入**：在列表页点「开始」进入 `T2026001` 工作台（URL 变为 `/tasks/T2026001/workbench`）。
- [x] **单页材料**（营业执照）：原件栏渲染页图（`naturalWidth=900`，`decode()` 成功），文字栏显示对应 OCR 文字；
      页码「第 1 / 1 页」，上一页/下一页**均禁用**；文字含「营业执照（副本）」「91310000MA1FL2XY7K」「华信资本管理有限公司」，与页图一致。
- [x] **多页材料**（财务报表 3 页）：第 1 页 → 第 2 页 → 第 3 页，页码分别为「第 1/3」「第 2/3」「第 3/3」，
      页图 `src` 与文字内容逐页变化（资产部分 / 负债和所有者权益部分 / 利润表）；
      首页「上一页」禁用、末页「下一页」禁用；翻回第 1 页时页图与文字与首次渲染完全一致。
- [x] **材料切换重置**：停在第 2 页切到营业执照单页材料 → 页码回到「第 1/1 页」、图文整体替换为营业执照、
      两栏 `scrollTop` 均为 0（无旧图文与滚动残留）；再切到未挂样例的公司章程 → 显示「暂无预览数据」，
      DOM 中无 `img` / `pre` / `.task-preview__body` 残留，页码显示「暂无页码」，翻页按钮禁用。
- [x] **双栏独立滚动**（1440px，第 2 页）：滚原件栏 → `imgScrollTop` 由 0 变 150，文字栏 `textScrollTop` 保持 0；
      再滚文字栏 → `textScrollTop` 变 200，原件栏 `textScrollTop`/`imgScrollTop` 保持 150 不变（两栏互不影响）。
      原件栏可滚动量 253px、文字栏 213px，**两栏都能产生实际滚动**。
- [x] **不改变任务状态**：打开工作台、翻页、切换材料后，状态标签仍为「一般 / 待核对」，无状态流转。
- [x] **只读入口**（`T2026004`）：标签为「一般 / 已完成 / 只读」，材料 Tabs 三个可见，可预览；
      从列表点「查看」可正常进入。
- [x] **390px 窄屏**：`gridTemplateColumns` 变为单列（`318px`）即上下布局；「上一页／下一页」可用（第 1 → 第 2 页切换正常）；
      「返回我的任务」入口可见，翻页控件可见；`documentElement.scrollWidth === clientWidth === 390`（无横向溢出）；
      无材料空态在窄屏同样正常。
- [x] **控制台与网络**：整页重载后重跑（切换材料 + 翻页），`Runtime.consoleAPICalled` 无 error/warning、
      `Log.entryAdded` 无记录、`Network.loadingFailed` 无记录。
- [x] **截图**存入 `docs/screenshots/`：`cp81-{no-material,single-license,multi-financial,no-sample-material,readonly-completed}-{desktop,narrow}.png`（共 10 张）。

### 验收中发现并修复的缺陷

- [x] **页图无法解码**：SVG data URI 缺少根 `<svg xmlns/width/height/viewBox>` → `<img>` 抛
      `EncodingError: The source image cannot be decoded.`，页图渲染为 24px 空 alt 文本，
      导致原件栏无法滚动（`imgScrollH === imgClientH`），并触发 10 条 `[ResourceError]` 控制台错误。
      修复：`frame()` 输出完整 SVG 文档。修复后 `naturalWidth=900 / naturalHeight=1200`、`decode()` 成功。
- [x] **无样例材料页码显示「第 1 / 0 页」**：改为无样例时显示「暂无页码」。

### 未覆盖 / 已知限制

- [ ] 页图的视觉版式与真实扫描件不同（示意图），不用于判断 OCR 质量。
- [ ] 键盘操作（Tab 聚焦翻页按钮、方向键翻页）未做走查。
- [ ] 长材料（>50 页）的页码导航只有「上一页／下一页」，没有跳页输入或页码缩略图。
- [ ] 预览区未做懒加载 / 虚拟滚动（当前样例仅 3 页）。

## 前端
- [ ] 键盘全流程走查：Tab 顺序与 Esc 已验收（见 CP7），**Enter 直接提交表单**仍未做。
- [ ] `prefers-reduced-motion` 下回弹动效关闭的自动化断言。
- [ ] 弱网 / 慢接口下的 loading 与超时提示。
- [ ] 多标签页同时登录 / 退出的状态同步。
- [ ] 前端组件测试（Vitest）与端到端测试（Playwright）基建。
- [ ] 侧栏多级菜单与面包屑的自动化断言（当前「我的任务」为单级菜单，工作台走 `activePath` 高亮）。

## 后续迭代（CP8 后续阶段）

- [ ] **接真实单图 OCR**：核对后端实际响应的**页码口径**（从 0 还是 1 开始）、**页宽高**、`bbox` 格式与**坐标空间**
      （相对页图还是相对渲染尺寸、是否随缩放变化），据此确定持久化结构（页图存对象存储还是页表、OCR 文本存 JSON 还是关系表）。
- [ ] **接真实多页 PDF**：PDF 解析与逐页转图，再单独验收**坐标定位与高亮**（本轮 `PreviewPage` 刻意不含 `bbox`）。
- [ ] **章程检查项摘录与人工决定**：原文 / 摘录 / 出处 / 接受或拒绝（拒绝需填原因）的落库与回显。
- [ ] **真实上传与 OCR 处理中状态**：上传进度、轮询、缺材料、提取失败、覆盖不全等工作台内部状态。
- [ ] 数据库改动：任务 / 材料 / 页 / OCR 文本的表结构与迁移。





## 核对工作台布局与真实 PDF 预览（CP8.2 · 2026-11-25）

### 本阶段阅读清单（按 `AGENTS.md` D30 归档）

| # | 文件 | 用途 |
| --- | --- | --- |
| 1 | `frontend/src/views/tasks/workbench/index.vue` | 工作台现状（CP8.1 版），本轮重写的对象 |
| 2 | `frontend/src/mock/tasks.ts` | 材料结构与种子任务，确认要加「原件格式 / 原件地址」 |
| 3 | `frontend/src/mock/previews.ts` | 页图样例与识别文字来源，确认要解耦 |
| 4 | `frontend/src/views/tasks/list/index.vue` | 列表页入口与三态按钮文案（回归用） |
| 5 | `frontend/src/router/routes/staticRoutes.ts` | `/tasks` 路由、`meta.activePath`、面包屑来源 |
| 6 | `frontend/src/locales/langs/zh.json` / `en.json` | `menus.tasks.*` 文案（面包屑统一用） |
| 7 | `frontend/vite.config.ts` | `base` / proxy / AutoImport / build.target，确认 Worker 打包方式 |
| 8 | `frontend/src/assets/styles/core/app.scss` | `.art-full-height` / `.art-table-card`（剩余视口高度的基础） |
| 9 | `frontend/src/assets/styles/core/el-ui.scss` | `.el-button` 覆写位置（hover 特效落点） |
| 10 | `frontend/src/assets/styles/core/motion.scss` | 既有 `.motion-press` 按压反馈，避免 hover 规则覆盖它 |
| 11 | `frontend/src/assets/styles/index.scss` | 全局样式引入顺序 |
| 12 | `frontend/src/hooks/core/useLayoutHeight.ts` | `--art-full-height` 的写入时机 |
| 13 | `frontend/node_modules/pdfjs-dist/types/src/display/api.d.ts` | `RenderParameters{canvas,viewport}` / `GlobalWorkerOptions` / `PDFDocumentProxy` |
| 14 | `frontend/node_modules/pdfjs-dist/build/pdf.mjs` | Worker 解析方式、`rendererSrc` 未设置会抛错（该路径本轮不启用） |

### 逐项验收（开发模式，1440×900 与 390×844）

| # | 验收项 | 结果 | 证据 |
| --- | --- | --- | --- |
| ① | 布局压缩：改造前后截图、左右预览区可见高度、核对区变大、左右独立滚动 | 通过 | 改造前：任务信息卡 138px、预览区 468px、单栏高 466px；改造后：紧凑栏 40px、预览区 618px、左右栏各 576px（顶边对齐 286px）。长文本下左栏滚到 80 时右栏仍为 0，右栏滚到 103 时左栏仍为 80。截图 `cp82-layout-before-desktop.png` / `cp82-layout-after-desktop.png` |
| ② | 预览切换：图片 → PDF → 图片，内容 / 页码 / 右栏状态正确更新 | 通过 | PNG：第 1 / 1 页、`license-scan.png` 原图 900×1400 适应宽度、右栏有识别文字；PDF：第 1 / 3 页、3 张画布、右栏「暂无识别结果」；切回 PNG：页图与文字复原、无 PDF 组件残留；重进 PDF 回到第 1 页且恢复「适应宽度」 |
| ③ | PDF 阅读：第一页渲染、连续滚动更新页码、前后翻页、缩放与恢复适应宽度 | 通过 | 首屏画布 522×738 且取样到 2806 个红像素 + 3474 个深色像素（页码为红字，说明真实渲染）；滚到底 → 第 3 / 3 页；上一页 → 第 2 / 3 页（scrollTop 762）；下一页 → 第 3 / 3 页且「下一页」禁用；首页「上一页」禁用；放大 → 652px / 125%，缩小 → 522px / 100%，「适应宽度」在已是适应宽度时禁用 |
| ④ | 窄屏 390px：返回入口、材料切换、PDF 翻页与缩放可用，整页无横向溢出 | 通过 | `documentElement.scrollWidth == clientWidth == 390`；回到工作台、4 个材料页签可点；PDF 3 张画布、翻页到第 2 / 3 页、放大到 125%（画布超宽由 PDF 区自身横向滚动，页面不溢出）；窄屏工具栏改为可换行自适应高度 |
| ⑤ | 干净构建：克隆到新目录、检出交付 SHA、`pnpm install --frozen-lockfile` + `pnpm build` | 通过 | 见下方「干净构建记录」 |
| ⑥ | 生产产物试跑：起 dist、登录、确认 Worker 加载与翻页；开发模式同样冒烟 | 通过 | 见下方「生产产物试跑记录」 |

### 附带项：按钮 hover 反馈

- 新增 `frontend/src/assets/styles/core/hover.scss`：实心 / 描边 / 链接按钮 hover 上浮 1px + 投影，文本型按钮只换背景色；全部走主题变量（暗色模式跟随），并尊重 `prefers-reduced-motion`。
- 实测：列表页「开始」（链接型）与工作台「返回我的任务」（默认型）hover 后 `transform: translateY(-1px)` + `box-shadow: 0 4px 12px`，移开即复位；截图 `cp82-button-hover.png`。
- 注意：Element Plus 的按钮样式是独立 CSS chunk，加载顺序在全局样式之后，因此用 `.el-button.el-button:where(...)` 提高一级优先级，保证 transition 生效（且不覆盖 `motion.scss` 的 `.motion-press` 缩放）。

### 干净构建记录

验收目录 `/tmp/v3-cp82-clean`（`git clone` 自本仓库后 `git checkout cd6b7a5`；无 `node_modules` 复用，依赖真实安装；
构建前未启动开发服务，也未手工准备任何声明文件）：

| 项 | 值 |
| --- | --- |
| 检出 SHA | `cd6b7a5025ae46cdd0cb154b6d34471465f44269` |
| Node / pnpm | `v24.14.0` / `10.32.1` |

| 命令 | 退出码 | 关键输出 |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | **0** | `Done in 487ms`（lockfile 为 pnpm 10.32.1 重排后的 YAML 风格，`lockfileVersion` 仍为 `9.0`，`--frozen-lockfile` 通过） |
| `pnpm build`（= `vue-tsc --noEmit && vite build`） | **0** | 类型检查 0 error → `✓ built in 11.04s` |

产物核对：`dist/index.html`、`dist/samples/charter.pdf`（199066 B / 3 页）、`dist/samples/license-scan.png`（900×1400）、
`dist/assets/pdf.worker.min-CIqJB0yW.mjs`（1271915 B，与 `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` **SHA-256 完全一致**，
说明 `?url` 是原样拷贝而非二次打包）；构建后 `git status --short` 为空。

### 生产产物试跑记录

启动方式：自写静态服务 `/tmp/cp82/serve.mjs` 提供 `/tmp/v3-cp82-clean/frontend/dist`（端口 4180），并把 `/api` 代理到本机后端 8000
（**保留原始 Host 头**——后端 `require_trusted_origin` 用 `origin.netloc == request.headers['host']` 做同源判定，
代理若改写 Host 会让 Cookie 写请求被判「请求来源不被信任」而 403）。

登录：`POST /api/v1/auth/login` → 200，`Set-Cookie: refresh_token=...; HttpOnly; Path=/api/v1/auth; SameSite=lax`；
刷新页面后 `POST /api/v1/auth/refresh` → 200（「会话已续期」），会话保持正常。

| 项 | 生产产物（dist @ 4180） | 开发模式（dev @ 3006） |
| --- | --- | --- |
| Worker 资源 | `/assets/pdf.worker.min-CIqJB0yW.mjs`（**产物目录内**，200 / `text/javascript`） | `/node_modules/.pnpm/pdfjs-dist@6.5.438/.../pdf.worker.min.mjs?url` |
| PDF 资源 | `/samples/charter.pdf` | `/samples/charter.pdf` |
| 首屏 | 页码「第 1 / 3 页」，3 张画布 522×738 | 同左 |
| 渲染取样 | 2806 个红像素 + 1693 个深色像素（页码为红字，证明真实渲染而非空白画布） | 同左 |
| 翻页 | 下一页 → 第 2 / 3 页（scrollTop 762）→ 第 3 / 3 页且「下一页」禁用 | 同左 |
| 右栏 | 「暂无识别结果」（PDF 样例无 OCR 文字） | 同左 |
| 控制台 / 网络 | 无 error / warning，无请求失败 | 无 error / warning，无请求失败 |

截图：`docs/screenshots/cp82-prod-pdf-desktop.png`（生产产物，第 3 / 3 页）。

> **测试环境坑（不是产品缺陷）**：用 CDP 直连的后台标签页 `document.visibilityState === 'hidden'`，
> 浏览器不执行 `requestAnimationFrame`，而 pdf.js 的渲染循环正是用 rAF 调度 → 渲染 promise 永久挂起、
> 表现为「页码一直停在『暂无页码』、画布空白但无任何报错」。
> 验收脚本需先 `Emulation.setFocusEmulationEnabled` + `Page.bringToFront` 让页面可见，rAF 恢复后渲染才正常。
> 排查过程另见 `HANDOFF_CODE.md` §14.4。

### 后续验证（下一阶段接真实 OCR 时单独核对）

1. **单张图片**：沿用已实测的原图像素坐标基准（`license-scan.png` 为 900×1400；真实上传后需核对像素尺寸与 `bbox` 坐标来源是否同一坐标系）。
2. **真实 PDF 接 OCR 后**：单独核对「OCR 页图」与「PDF.js 渲染页」的页码口径、页面方向（旋转 / 竖排）、可见区域是否一致；两者对齐后才验收区域高亮。
3. **页码口径**：OCR 返回的页码与 PDF.js 的 `numPages` 是否从 1 开始、同序；本页 PDF 样例 3 页、页脚写明「第 N 页 / 共 3 页」。
4. **Worker 产物**：生产构建里 Worker 是独立 chunk（`dist/assets/pdf.worker.min-*.mjs`），后续若改 CDN / 离线包策略需重跑本表 ⑥。
