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

## 前端
- [ ] 键盘全流程走查：Tab 顺序与 Esc 已验收（见 CP7），**Enter 直接提交表单**仍未做。
- [ ] `prefers-reduced-motion` 下回弹动效关闭的自动化断言。
- [ ] 弱网 / 慢接口下的 loading 与超时提示。
- [ ] 多标签页同时登录 / 退出的状态同步。
- [ ] 前端组件测试（Vitest）与端到端测试（Playwright）基建。
- [ ] 侧栏多级菜单与面包屑的自动化断言（当前「我的任务」为单级菜单，工作台走 `activePath` 高亮）。



