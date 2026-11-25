# DECISIONS

记录本项目关键实现取舍。追加式，勿改写历史条目。

## 2026-11-22

### D1 · 上游基线导入方式
- **选择**：把上游 ADP 源码原样拷入 `frontend/`，由根目录单一 Git 仓库管理；不保留上游 `.git`。
- **原因**：任务要求「整个项目由根目录的 Git 仓库管理」，且需要保留一个可对照的「未改造基线」提交。
- **代价**：无法用 `git log` 追溯上游历史，改动需人工对照上游仓库。

### D2 · `/dashboard` 走静态受保护路由，不接动态菜单
- **选择**：`/dashboard` 注册为静态路由 + 精简守卫，移除路由守卫里的「动态路由注册 / 菜单拉取 / 权限校验」链路。
- **原因**：本轮只做认证，认证流程不应依赖上游的动态菜单与 `/api/v3/system/menus` 权限接口。
- **代价**：后续接入业务菜单时需要重新引入 `RouteRegistry` / `MenuProcessor`。

### D3 · Access Token 只存内存，Refresh Token 走 HttpOnly Cookie
- **选择**：access token（15 分钟）仅存在 Pinia 内存里，刷新页面后用 refresh cookie（7 天）换新 access token；refresh token 在库里只存哈希。
- **原因**：满足「前端仅在内存持有 access token」与「刷新后保持登录」；降低 XSS 场景下 token 泄露的影响面。
- **代价**：刷新页面必然多一次 `/api/v1/auth/refresh` 往返。

### D4 · 注册写入与欢迎任务投递共用一条 psycopg 事务
- **选择**：注册 service 用一条 `psycopg` 异步连接开事务 → `INSERT INTO users` → 用同一连接向 Procrastinate 投递 `send_welcome_email` → 一次性提交；任一步失败整体回滚。
- **原因**：保证「用户创建」与「欢迎邮件任务」原子一致，避免出现有用户无任务或反之的中间态。
- **代价**：注册路径不使用 SQLAlchemy + asyncpg，与其他业务路径存在两套数据库访问方式。

### D5 · 统一 JSON 响应包络
- **选择**：所有接口返回 `{"code": ..., "msg": "...", "data": ...}`；HTTP 201 的注册成功响应业务 `code` 仍为 `200`。
- **原因**：与 ADP 前端既有拦截器（按 `code` 判成功）保持一致，同时保留真实 HTTP 状态码语义。

### D6 · 已签发 access token 在退出后仍然有效
- **选择**：退出只撤销 refresh 会话并清 Cookie，不做 access token 黑名单。
- **原因**：本轮无 token 吊销基础设施；JWT 无状态验证天然具备该行为。
- **代价**：退出后旧 access token 在 15 分钟有效期内仍可使用，需要在文档中明确告知后续业务。

### D7 · Procrastinate 队列表初始化做成幂等
- **选择**：`app/queue/setup.py` 先查 `procrastinate_jobs` 表与枚举类型是否已存在，存在则跳过 `apply_schema_async()`。
- **原因**：Procrastinate 的 `apply_schema_async` 内部是 `CREATE TYPE` / `CREATE TABLE`（不带 `IF NOT EXISTS`），
  只能作用于空库；Compose 每次 `up` 都会跑一次迁移服务，不做幂等处理第二次就会失败并阻塞后端启动。
- **代价**：Procrastinate 升级时不会自动应用官方迁移脚本，需要人工比对 `migrations/` 目录。

### D8 · 测试跑在独立的 PostgreSQL 库，不使用 SQLite 替身
- **选择**：`tests/conftest.py` 自动创建 `compliance_test` 库，执行 Alembic 迁移与队列表初始化，用例前清表。
- **原因**：注册事务依赖真实 PostgreSQL 的唯一约束与 Procrastinate 队列表，SQLite 无法覆盖；
  隔离测试库还能避免测试数据污染开发库与运行中的 worker。
- **代价**：运行 pytest 需要一个可访问的 PostgreSQL 实例（CI 里需要先起服务）。

### D9 · 登录 / 注册接口不参与 401 自动刷新
- **选择**：`fetchLogin`、`fetchRegister` 带 `skipAuthRefresh: true`，401 直接抛后端 `msg`，不走 refresh 重试、也不触发全局清会话。
- **原因**：登录失败是「凭据错误」而非「会话过期」。早期版本让登录 401 触发一次 refresh，
  refresh 也失败时抛出的原始 Axios 错误覆盖了后端文案，页面显示通用「请求失败」而不是「邮箱或密码错误」，
  违背「前端应能区分字段错误、凭据错误和服务异常」。
- **代价**：登录失败时不再顺带清理可能存在的旧会话（此时用户本就未登录，无副作用）。


### D10 · `/dashboard` 采用「父路由承载布局 + 子路由承载内容」的嵌套结构
- **选择**：`staticRoutes` 中 `/dashboard`（name `Dashboard`）的 `component` 指向 `@views/index/index.vue`（上游 AppLayout），
  子路由 `path: ''`（name `DashboardWorkbench`）指向 `@views/dashboard/index.vue`；布局内的 `ArtPageContent`
  通过 `RouterView` 渲染子级。
- **原因**：这正是上游 ADP 承载业务页的方式，`ArtPageContent` 的 `KeepAlive`（依赖 `route.meta.keepAlive`）、
  顶部工作标签页、面包屑都按「子路由」粒度工作；扁平路由会让这些能力全部失效。
- **代价**：工作台组件的 `name` 必须是 `DashboardWorkbench`（与路由 name 一致）才能命中 KeepAlive 缓存。

### D11 · 侧栏菜单用本地静态路由提供，不接上游动态菜单
- **选择**：新增 `staticMenuList`（当前只有「工作台」一项），由路由守卫在会话就绪后调用
  `useMenuStore().setMenuList(staticMenuList)` 注入；不恢复上游的 `RouteRegistry` / `MenuProcessor` 与后端菜单接口。
- **原因**：本项目暂无多角色与权限分级需求；上游动态菜单依赖后端菜单表与权限接口，现阶段接入只会增加未验证的耦合。
  `staticMenuList` 的每项都带 `component`（侧栏 `SidebarSubmenu.filterRoutes` 判定叶子可导航的必需条件之一）。
- **代价**：新增页面时需同时更新 `staticRoutes` 与 `staticMenuList`；接入真实后端菜单时需重新引入 D2 提到的动态路由机制。
- **补充**：菜单必须在守卫里注入而非只在初始化时设置 —— `userStore.clearSession()` 会调用
  `setHomePath('')` 与 `resetRouterState(500)`（清空 `menuList`），若不在会话恢复后重新注入，
  登出再登录时侧栏会空白且 `homePath` 为空。

### D12 · 恢复 `setWorktab`，但去掉 iframe 分支
- **选择**：新建 `frontend/src/utils/navigation/worktab.ts`，按上游实现 `setWorktab(to)`（供守卫调用），
  删掉依赖已删除的 `IframeRouteManager` 的 iframe 分支。
- **原因**：顶栏工作标签页由 `settingStore.showWorkTab`（默认开启）控制，若不做路由同步，
  标签栏会出现但永远没有标签。
- **代价**：与上游实现存在一个有意为之的差异（无 iframe 支持）；本项目当前也不使用 iframe 页面。

### D13 · 注册开关通过公开只读接口下发给前端
- **选择**：新增 `GET /api/v1/auth/config` 返回 `{"registrationEnabled": bool}`；前端由 `useAuthStore` 缓存，
  登录页用它控制「注册」入口显示，路由守卫用它拦截直接访问 `/auth/register`。
- **原因**：注册是否开放是服务端权威配置，前端不应硬编码；后端 `POST /register` 的 403 才是最终防线，
  前端拦截只用于体验（隐藏入口 / 提前回到登录页）。
- **代价**：登录页与注册路由会多一次轻量请求；配置拉取失败时按「开放注册」处理，避免因网络抖动误伤正常用户。

### D14 · 交付界面移除上游演示件
- **选择**：关闭 `globalComponentsConfig['chat-window']`（右下角机器人）、`headerBar.chat`（顶栏聊天入口）、
  `headerBar.fastEnter`（底部开发浮层）与 `showSettingGuide`（设置引导气泡）；
  `fastEnter.ts` 的应用列表重写为只保留「工作台」；头像菜单删除「个人中心 / 文档 / GitHub」等外链入口。
- **原因**：这些是上游模板的演示功能，与本项目无关，且会暴露 `artd.pro` 等第三方链接。
- **代价**：上游 `WEB_LINKS` 常量成为死代码（保留未删，避免误删被其它模块引用）。

### D15 · 注册页复用上游授权页样式

- **选择**：注册页恢复上游基线的 `<style scoped>@import '../login/style.css';</style>`，
  `.auth-right-wrap` / `.form` / `.title` / `.sub-title` / `.custom-height` 全部沿用登录页同一份定义。
- **原因**：上游把授权页容器样式集中放在 `login/style.css`，注册页通过 import 复用；
  我们此前重写注册页时丢掉了这个 import，导致容器失去宽度约束（输入框横向铺满、标题贴顶）。
- **代价**：注册页样式依赖登录页文件路径，删除登录页会连带影响注册页。



### D16 · 前端基于 ADP 二次开发，不从零搭建
- **选择**：把 ADP 作为前端底座，在其上做减法与改造，不重建设计系统。
- **原因**：视觉质量已验证，省去从零搭建 UI 与动效体系的时间。
- **代价**：继承 Element Plus 组件体系，后续若想换 UI 库成本较高。

### D17 · 动效沿用 ADP 已有基础，不引入 motion-v
- **选择**：按钮 hover、按压回弹、页面过渡沿用 ADP 现有实现；如需补弹簧效果，用 `@vueuse/motion` 的 `v-motion` 指令。
- **原因**：避免为单个按压效果引入额外的重型动画库。
- **代价**：动效参数分散在 ADP 既有代码与少量新增指令中，统一 token 需要在后续迭代中逐步收敛。

### D18 · 上游 `fetchLogin` 使用 `params` 传参（非 `data`）
- **记录**：ADP `src/api/auth.ts` 的 `fetchLogin` 以 `params` 传参（参数走 query string），而非 `data`（请求体）。
- **影响**：对接 FastAPI 时，后端若用 Pydantic body model 接收，会收不到字段或返回 422。
- **待决**：联调阶段需二选一——改前端为 `data`，或后端用 query 参数接收。决策前不要凭常识假设其中一种。

---

## CP7 · 我的任务原型

### D19 · 任务数据先用前端模拟模块，不接后端
- **选择**：新增 `frontend/src/mock/tasks.ts` 作为唯一数据源，列表页与工作台都从它取数；
  本轮不定义任务相关的后端接口与数据库模型。
- **原因**：本轮目标是「用前端模拟数据跑通交互」并做浏览器验收；提前建表会引入尚未定稿的字段
  （材料原文、摘录、出处、核对结论、权限归属等），返工成本高于收益。
- **代价**：任务不能跨浏览器、跨设备共享；下一阶段接真实接口时需替换本模块的读写实现，
  页面调用方式保持不变（`listTasks` / `createTask` / `getTaskById`）。

### D20 · 任务数据与筛选条件一起放 sessionStorage
- **选择**：sessionStorage 单键 `compliance-task-mock` 存 `{ tasks, query }`；同标签页刷新保留，
  新标签页（新会话）回到种子样例。
- **原因**：需求明确「同一浏览器标签页创建任务后，刷新列表或工作台仍能看到对应任务」，
  且「搜索词与状态筛选与任务数据一起存入 sessionStorage，确保刷新工作台后返回仍能恢复」。
  把筛选条件与数据放同一个键，可以一次读写保证两者一致。
- **代价**：sessionStorage 有容量上限（约 5MB），任务量增大后需要迁移到 IndexedDB 或直接接后端；
  筛选条件存本地意味着换浏览器后筛选条件不跟随（这是原需求的直接结果，不是缺陷）。

### D21 · 任务状态口径固定为三态，新建一律「待核对」
- **选择**：`TaskStatus = 'pending' | 'in_review' | 'completed'`；
  `createTask` 固定写入 `pending`；`in_review`（首次成功保存人工核对决定后进入）与
  `completed`（完成操作成功后进入）本轮只由种子样例提供。
- **原因**：状态口径是业务约定，需在前后端之间保持一致；本轮不做人工决定与完成操作，
  提前实现这两个流转会引入没有真实触发路径的分支。
- **代价**：本轮无法通过界面产生「核对中 / 已完成」，这两种状态只能从种子数据进入；
  下一阶段实现人工决定保存时，需要在同一处接入 `pending → in_review` 的流转。

### D22 · 材料切换用 ElTabs 实现「单内容区替换显示」
- **选择**：工作台材料区用 `ElTabs type="card"`，各材料面板在同一处渲染，切换时替换内容区，
  当前材料以选中态呈现。
- **原因**：需求要求「沿用单展开区替换显示的交互，点击材料入口时只切换同一块内容区，
  当前材料有清楚的选中状态」。Element Plus 的 `ElTabs` 原生满足，且与上游
  `src/views/examples/tables/index.vue` 中 `ElCollapse` 的同类用法一致（同一区域替换而非堆叠）。
- **代价**：`ElTabs` 在窄屏下横向标签较多时需要滚动；当前每任务材料数为 2–3，暂不构成问题。

### D23 · 列表页复用 ADP 的 ArtSearchBar + ArtTable + ArtTableHeader，不自建表格
- **选择**：列表页直接用上游的 `ArtSearchBar`（搜索）、`ArtTable`（表格）、`ArtTableHeader`（工具栏），
  弹窗用 `ElDialog` + `ElForm`；列定义走 `useTableColumns` + `useSlot` 插槽。
- **原因**：用户明确要求「复用 ADP 原有页面、组件、按钮、控件等等，摘出来改，而不是自己从零写」；
  上游 `src/views/system/user/**` 已是「搜索栏 + 表格 + 弹窗」的完整范式。
- **代价**：上游 `ArtSearchBar` 的 `reset` 语义是「恢复到 setup 时的初始快照」而非「清空」，
  所以重置语义由列表页的 `handleReset` 实现，不依赖组件内部快照（见 HANDOFF_CODE 第 11 节注意事项）。

### D24 · 表格插槽里的行数据用收口函数补类型
- **选择**：不直接写 `TASK_STATUS_TEXT[row.status]`，而是定义
  `getStatusText(row)` / `getStatusTagType(row)` / `getCustomerTypeText(row)` / `getActionText(row)`
  四个函数，把 `any` 收口回 `ReviewTask`。
- **原因**：`ArtTable` 的插槽作用域没有声明行类型，`row` 是 `any`；直接索引 `Record` 会触发
  TypeScript 的 TS7053（隐式 any 索引），`vue-tsc --noEmit` 不通过。
- **代价**：多一层薄封装；若将来 `ArtTable` 补上行类型泛型，这几个函数可以删掉。

### D25 · 工作台不引入 KeepAlive，任务数据由 route.params 驱动
- **选择**：工作台路由不加 `meta.keepAlive`；任务通过 `computed(() => getTaskById(route.params.taskId))` 取；
  同时用 `watch(task)` 同步顶部标签页标题。
- **原因**：需求明确「本轮无需引入 KeepAlive」「工作台按当前路由中的 taskId 获取数据，
  直接访问、刷新和切换任务时均显示对应任务」。不缓存可天然避免切换任务后残留上一条任务信息。
- **代价**：从工作台返回列表再进入工作台会重新取数（本地模拟，无性能问题）。

### D26 · 工作台通过 meta.activePath 保持侧栏高亮「我的任务」
- **选择**：工作台子路由设 `meta.activePath = '/tasks'`；侧栏菜单只保留「我的任务」一项，
  不为工作台单独建菜单项。
- **原因**：需求要求「进入工作台时侧栏继续高亮『我的任务』（工作台不新增侧栏菜单项）」。
  `ArtSidebarMenu` 用 `route.meta.activePath || route.path` 计算选中项，`activePath` 正是为此设计的。
- **代价**：多一个非标准 meta 字段，需要在 `staticRoutes.ts` 注释中说明（已写）。

### D27 · 表单提交锁前置：先上锁再校验
- **选择**：`task-create-dialog.vue` 的 `handleSubmit` 里把 `submitting.value = true` 提到
  `await formRef.value.validate()` **之前**，校验失败时在 `finally` 复位。
- **原因**：浏览器验收时发现，连点两次「创建」会创建两条任务——因为原实现先 `await` 校验，
  两次调用都能越过 `submitting` 判断，等校验返回后依次创建。锁必须覆盖整个异步区间。
- **代价**：校验期间按钮进入 `loading` 态（期望行为）；表单校验失败时也会短暂闪一下 loading。

### D28 · 浏览器验收改用原生 CDP 直连，绕开 chrome-devtools MCP
- **选择**：不再依赖 chrome-devtools MCP 的 `evaluate_script` / `take_screenshot` / `resize_page`，
  改为用 Node + WebSocket 直连 `http://127.0.0.1:9333/json/list` 的 page target，
  自己发 `Page.navigate` / `Runtime.evaluate` / `Emulation.setDeviceMetricsOverride` / `Page.captureScreenshot`。
- **原因**：本机 Trae 的 MCP 桥接层把数值参数序列化成字符串，`pageId` 等参数全部触发
  `must be number` 校验失败，只有无参数的 `list_pages` 可用；继续在该 MCP 上排查会持续消耗时间。
- **代价**：需自备约 200 行 CDP 脚本（放在 `/tmp/cp7/`，不入库）；好处是视口模拟与截图可在同一会话内完成，
  且能用 `Target.createBrowserContext` 造未登录场景而不污染当前会话。

### D29 · 干净检出可构建：把自动导入声明文件纳入版本管理
- **选择**：把 `frontend/src/types/import/auto-imports.d.ts` 纳入版本管理（从 `frontend/.gitignore` 移除该行），
  `components.d.ts` 保持忽略；`build` 脚本维持 `vue-tsc --noEmit && vite build` 的顺序不变。
- **原因**：`auto-imports.d.ts` 由 unplugin-auto-import 在 Vite 构建期生成，被 `.gitignore` 排除，
  而 `build` 的第一步就是 `vue-tsc --noEmit` → 干净克隆第一步就报 TS2304（`Cannot find name 'ref'` 等 316 条）。
  实测确认：`components.d.ts` 对类型检查**非必需**（删除后仍 0 error），`auto-imports.d.ts` 是必需项；
  且它是 **preset 全量声明**（304 项，含未使用的 `useDark`/`useTemplateRef`），与业务代码无关，
  因此入库后不会随日常开发变旧 —— 日常新增的自动导入几乎必然已在其中。
  候选方案「把 build 改为 `vite build && vue-tsc --noEmit`」被否：会让类型检查失去对产物的门禁作用
  （产物先落地、类型错误后暴露），且每次构建仍要完整打包。
- **代价**：仓库多一个生成文件；升级 `vue` / `@vueuse/core` / `pinia` 后需重新生成并提交
  （`pnpm dev` 或 `pnpm build` 会自动刷新该文件；若此时 `vue-tsc` 报 TS2304，先刷新再提交）。
  生成内容是确定性的 —— 已验证干净克隆与工作区生成结果逐字节一致，不会造成构建后 git 脏文件。

### D30 · 阅读计划与「同文件不重复读取」规则的冲突处理
- **选择**：阅读计划写入 `HANDOFF.md`（按 AGENTS.md 的 ≤15 个/阶段约束），**阶段结束即归档到 `TEST_TODO.md`**；
  同一文件按阶段只读一次，跨阶段复用 `HANDOFF_CODE.md` 里的摘要（作用、调用关系、需修改位置）。
- **原因**：两条规则在长会话下天然冲突 —— 规则一要求每阶段都写清单，规则二又禁止重复读同一文件；
  若把清单长期留在 `HANDOFF.md`，它会随阶段累积并挤占交接文档（CP7 后 `HANDOFF.md` 已达 134 行，
  超过「≤50 行」的交接要求）。归档到 `TEST_TODO.md` 既保留可追溯性，又让 `HANDOFF.md` 保持精简可交接。
- **代价**：归档动作需要主动执行（本轮由 CP7.5 补做）；`TEST_TODO.md` 承担了「验收 + 归档」双重职责，篇幅偏长。

### D31 · 预览样例按 `taskId::materialId` 索引，页图用内联 SVG data URI
- **选择**：新增独立模块 `frontend/src/mock/previews.ts`，用 `` `${taskId}::${materialId}` `` 作为索引键，
  页图由 TS 在运行时生成 **内联 SVG → data URI**，OCR 文字与页图由**同一份 rows 数据**派生。
- **原因**：
  - 按 `taskId::materialId` 索引可避免同类型材料串样（`T2026003` 与 `T2026001` 都有「财务报表」，
    只按 `materialId` 或材料类型索引会取到别的任务的页）。
  - 页图用内联 SVG 而不是落二进制资产：不引入外部文件、不需要图片处理依赖、内容可读可 diff、
    生成完全确定；文字与页图同源 → 天然保证「图文一致」这一验收点。
- **代价**：SVG 页图是「示意图」而非真实扫描件，版式与真实证照有差异；
  `frame()` 必须输出完整 SVG 文档（根 `<svg xmlns width height viewBox>`），否则 `<img>` 解码失败（见 `HANDOFF_CODE.md` §12 的坑）。
- **接真实 OCR 时替换点**：只需替换 `getPreviewSample()` 的取值实现（改为请求后端 OCR 结果），
  页面侧 `currentPage.image` / `currentPage.text` 的消费方式不变；届时需核对真实响应的页码、页宽高、`bbox` 格式与坐标空间。

### D32 · 材料 Tabs 只做选择，预览区只保留一套；切换材料即重置页码与滚动
- **选择**：工作台顶部 `ElTabs` **只做材料选择**（每个 `ElTabPane` 内不再放内容），
  下方保留**一套**双栏预览区，按当前 `materialId` 重新取数渲染；
  `watch(activeMaterial)` → `pageNo = 1` 且两栏 `scrollTop = 0`。
- **原因**：若沿用「每个 TabPane 各放一套内容」，多材料会各留一份图文与滚动状态，
  切换回来时会残留上一份材料的页码/滚动位置，且材料多时 DOM 与状态成倍膨胀。
  单套预览区 + 按 `materialId` 取数，从根上消除「旧图文残留」。
- **代价**：切换材料有一次重新渲染（无闪烁问题，图片是 data URI 同步解码）；
  翻页与切材料都重置滚动到顶部（翻页时也重置，便于从新页顶部阅读）。
- **无样例材料的处理**：当前材料没有样例时显示「暂无预览数据」（`ElEmpty`）并清空图文；
  任务本身没有任何材料时仍沿用原有「该任务尚未上传任何材料」空态 —— 两者语义不同，不合并。
