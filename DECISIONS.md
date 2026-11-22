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

