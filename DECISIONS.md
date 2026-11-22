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
