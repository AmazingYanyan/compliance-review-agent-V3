# HANDOFF_CODE — 代码索引与调用关系

> 本文件记录**已读过的源码**的作用、函数输入输出、以及需要修改的位置，避免后续 agent 重复全文读取源文件。
> 路径均以仓库根目录为基准。

---

## 1. 认证后端

### `backend/app/api/v1/auth.py`
暴露的端点（统一包络 `{code, msg, data}`）：

| 方法与路径 | 输入 | 输出 | 状态码 |
| --- | --- | --- | --- |
| `POST /api/v1/auth/register` | `RegisterRequest{displayName, email, password}` | `UserResponse` | 201 / 409 重复邮箱 / 403 注册关闭 |
| `POST /api/v1/auth/login` | `LoginRequest{email, password}` | `TokenResponse{accessToken}` + refresh Cookie | 200 / 401 |
| `POST /api/v1/auth/refresh` | 仅 Cookie | 新 accessToken（轮换） | 200 / 401 |
| `POST /api/v1/auth/logout` | 仅 Cookie | `{}`（幂等，撤销 refresh + 清 Cookie） | 200 |
| `GET /api/v1/auth/config` | 无 | `AuthConfigResponse{registrationEnabled}` | 200（**本轮新增**） |
| `GET /api/v1/user/info` | Bearer accessToken | `UserResponse{id, displayName, email}` | 200 / 401 |
| `GET /health` | 无 | `{status, database, version}` | 200 |

关键行为：
- `register` 在函数首部检查 `if not settings.registration_enabled: raise AppError(403, "当前环境未开放注册")`。
- `login` / `refresh` 成功时通过 `set_refresh_cookie(...)` 下发 HttpOnly refresh Cookie（7 天）。
- `logout` 无论会话是否存在都返回 200。

### `backend/app/schemas/auth.py`
- `RegisterRequest` / `LoginRequest` / `TokenResponse` / `UserResponse` / `HealthResponse`
- **本轮新增** `AuthConfigResponse`：`registration_enabled: bool = Field(alias="registrationEnabled")`，序列化输出 camelCase。
- 常量 `DISPLAY_NAME_MIN/MAX_LENGTH`、`PASSWORD_MIN/MAX_LENGTH`；函数 `normalize_email(email)`（小写 + trim）。

### `backend/app/core/config.py`
- Pydantic Settings，`registration_enabled: bool = True`（环境变量 `REGISTRATION_ENABLED`）。
- 其它：数据库、Redis、JWT secret、CORS、cookie 域名等。

### `backend/tests/test_auth_api.py`
- 15 个用例全绿（`cd backend && .venv/bin/python -m pytest -q`）。
- **本轮新增** `test_auth_config_reports_registration_state`（默认开放）与
  `test_register_rejected_when_registration_disabled`（`monkeypatch.setattr(settings, "registration_enabled", False)` → 403 + config 返回 False）。
- `tests/conftest.py` 提供 `client` fixture（ASGITransport 直连应用 + 独立 PostgreSQL 测试库 `compliance_test`）与 `TEST_EMAIL/TEST_PASSWORD/TEST_DISPLAY_NAME`。

---

## 2. 前端 API 层

### `frontend/src/api/auth.ts`
- `fetchRegister(params)` → `request.post<Api.Auth.RegisterResult>` → `POST /api/v1/auth/register`
- `fetchLogin(data)` → `request.post<Api.Auth.LoginResult>` → `POST /api/v1/auth/login`（返回 `{ accessToken }`）
- `fetchLogout()` → `request.post` → `POST /api/v1/auth/logout`
- `fetchGetUserInfo()` → `GET /api/v1/user/info`
- `adaptUserInfo(raw)` → 把后端 `displayName` 映射为前端 `userName/username`，`roles: ['R_USER']`
- **本轮新增** `fetchAuthConfig()` → `GET /api/v1/auth/config`（`showErrorMessage: false`、`skipAuthRefresh: true`）

### `frontend/src/types/api/api.d.ts`
`namespace Auth` 内含 `AuthConfig{registrationEnabled}`（**本轮新增**）、`LoginParams`、`LoginResult`、`RegisterParams`、`RegisterResult`、`UserInfo`。

---

## 3. 前端状态

### `frontend/src/store/modules/user.ts`
- `accessToken` **仅存内存**；`persist.pick = ['language']`。
- `setToken(token)` / `setLoginStatus(bool)` / `setUserInfo(info)` / `getUserInfo`
- `signOut()`：`await fetchLogout()`（失败仅 warn）→ finally `logOut()`。**这是走后端退出接口的正确入口。**
- `logOut()`：保存 `LAST_USER_ID` → `clearSession()` → `router.push({ name:'Login', query:{ redirect } })`
- `clearSession()`：清 `userInfo/isLogin/isLock/lockPassword/accessToken`、删 iframeRoutes、
  `useMenuStore().setHomePath('')`、`resetRouterState(500)`（→ 清空 `menuList` 与动态路由）。
  **副作用**：登出后侧栏菜单与 homePath 被清空，守卫必须在会话恢复后重新 `setMenuList`。
- `checkAndClearWorktabs()`：守卫中调用，清理失效标签页。

### `frontend/src/store/modules/auth.ts`（**本轮新增**）
- `useAuthStore()`：`registrationEnabled`（默认 true）、`configLoaded`、`loadAuthConfig(force=false)`。
- `loadAuthConfig` 内部用模块级 `loading` Promise 去重并发请求；失败时保持默认「开放注册」，实际提交仍由后端 403 兜底。

### `frontend/src/store/modules/menu.ts`
- `setMenuList(list)` → `menuList.value = list`；`setHomePath(HOME_PAGE_PATH || getFirstMenuPath(list))`。
- `removeAllDynamicRoutes()`、`setHomePath(path)`、`getHomePath()`。

### `frontend/src/store/modules/worktab.ts`
- `openTab({title, icon, path, name, keepAlive, params, query, fixedTab})`；`removeTab/removeLeft/removeRight/removeOthers/removeAll/toggleFixedTab`。
- 持久化 key `sys-v{version}-worktab`。

---

## 4. 路由

### `frontend/src/router/routes/staticRoutes.ts`（**本轮整体重写**）
- `DASHBOARD_PATH = '/dashboard'`。
- `staticRoutes`：
  - `/auth/login`（name `Login`）、`/auth/register`（name `Register`），`meta.isHideTab: true`。
  - `/dashboard`（name `Dashboard`）= **父路由承载布局** `component: () => import('@views/index/index.vue')`，
    `meta: { title:'menus.dashboard.title', icon:'ri:pie-chart-line' }`；
    子路由 `path: ''`（name `DashboardWorkbench`）= `component: () => import('@views/dashboard/index.vue')`，
    `meta: { keepAlive: true, fixedTab: true }`。
  - `/403`、`/500`、`/:pathMatch(.*)*`。
- `staticMenuList`：**本地静态菜单**，当前只有「工作台」一项，`component: '/dashboard/index'`（`component` 是 `SidebarSubmenu.filterRoutes` 判定叶子可导航的必需条件之一）。

### `frontend/src/router/guards/beforeEach.ts`（**本轮修改**）
流程（`handleRouteGuard`）：
1. `/` → 重定向 `/dashboard`。
2. 非 `PUBLIC_PATHS` → `ensureSession(userStore)`；失败 → 跳 `Login?redirect=...`；
   **成功 → `useMenuStore().setMenuList(staticMenuList)`**（恢复侧栏与 homePath）。
3. 已登录访问登录/注册页 → 跳回 `/dashboard`。
4. **本轮新增**：访问注册页时 `await authStore.loadAuthConfig()`，`registrationEnabled === false` → 跳 `Login`。
5. 放行：`setPageTitle(to)` + `setWorktab(to)`（**本轮新增**）→ `next()`。
6. 未匹配路由 → `Exception404`。

其它导出：`resetRouterState(delay)`（清动态路由 + `setMenuList([])`）、`PUBLIC_PATHS`。

### `frontend/src/router/index.ts`
`createWebHashHistory()`；`routes: staticRoutes`；末尾 `export const HOME_PAGE_PATH = ''`（空值 → `setMenuList` 走 `getFirstMenuPath`）。

---

## 5. 导航工具

### `frontend/src/utils/navigation/worktab.ts`（**本轮新增**）
- `setWorktab(to: RouteLocationNormalized)`：`meta.isHideTab` 直接返回；否则 `useSettingStore().showWorkTab || path === useCommon().homePath.value` 时 `worktabStore.openTab({...})`。
- **与上游差异**：去掉了 iframe 分支（上游依赖已删除的 `IframeRouteManager`）。

### `frontend/src/utils/navigation/index.ts`（**本轮修改**）
`export * from './jump' | './route' | './worktab'`。

### `frontend/src/utils/navigation/route.ts`（只读）
- `isIframe(url)`、`isNavigableMenuItem(item)`（path 非空且 `(!isHide || isFullPage)`）、
  `getFirstMenuPath(menuList)`（优先下钻子菜单）、`normalizePath(path)`。

### `frontend/src/utils/navigation/jump.ts`（只读）
- `handleMenuJump(item, jumpToFirst=false)`：外部链接走 `openExternalLink`，否则 `router.push(item.path)`。

---

## 6. ADP 原生布局组件（复用，未改动）

- `frontend/src/views/index/index.vue`：**AppLayout**。`<aside id="app-sidebar">` → `ArtSidebarMenu`；
  `<main id="app-main">` 内 `#app-header` → `ArtHeaderBar`、`#app-content` → `ArtPageContent`；
  另有 `#app-global` → `ArtGlobalComponent`；样式 `@use './style'`。
- `frontend/src/components/core/layouts/art-header-bar/index.vue`：顶栏。含面包屑、搜索、全屏、语言、通知、设置、主题切换、`ArtUserMenu`。
  - `visibleMenu()` → `settingStore.setMenuOpen(!menuOpen)`（折叠/展开侧栏）。
  - 设置按钮用 `ElPopover :visible="showSettingGuide"` 渲染引导气泡。
- `frontend/src/components/core/layouts/art-header-bar/widget/ArtUserMenu.vue`（**本轮修改**）：
  - 菜单项由 4 项减为 1 项（锁屏）+ 退出登录；删除 `goPage`/`toDocs`/`toGithub`（上游外链）。
  - `loginOut()` 由 `userStore.logOut()` 改为 **`userStore.signOut()`**（先调后端 `POST /api/v1/auth/logout`）。
  - 退出前有 `ElMessageBox` 确认弹窗（「您是否要退出登录?」）。
  - 头像弹层显示 `userInfo.userName` / `userInfo.email`。
- `frontend/src/components/core/layouts/art-menus/art-sidebar-menu/index.vue`：
  - 菜单数据来自 `useMenuStore().menuList`；`menuOpen` 控制 `menu-left-open/close` 类。
  - 窄屏（`width < MOBILE_BREAKPOINT`）时侧栏默认收起，点击顶栏菜单按钮展开为 230px 覆盖层，
    同时 `showMobileModal` 打开 `.menu-model` 遮罩。
  - `toggleMenuVisibility()` → `settingStore.setMenuOpen(!menuOpen)`；窄屏下额外控制遮罩。
- `frontend/src/components/core/layouts/art-menus/art-sidebar-menu/widget/SidebarSubmenu.vue`：
  - `filterRoutes` 过滤 `meta.isHide`；叶子需 `component || meta.link || meta.isIframe===true`。
  - 点击 → `handleMenuJump(item)`。
- `frontend/src/components/core/layouts/art-page-content/index.vue`：
  `<RouterView v-slot="{Component, route}">`，KeepAlive 依据 `route.meta.keepAlive`，`:key="route.path"`。
- `frontend/src/components/core/layouts/art-global-component/index.vue`：
  `getEnabledGlobalComponents()` 按 `globalComponentsConfig` 挂载全局组件（chat-window 已禁用）。

---

## 7. 配置

| 文件 | 关键字段 | 本轮状态 |
| --- | --- | --- |
| `frontend/src/config/index.ts` | `systemInfo.name` | 改为 `'合规审查智能体'` |
| `frontend/src/config/setting.ts` | `SETTING_DEFAULT_CONFIG`（`showWorkTab/showCrumbs/showSettingGuide/...`） | `showSettingGuide: false`（去引导浮层） |
| `frontend/src/config/modules/component.ts` | `globalComponentsConfig['chat-window'].enabled` | `false`（去右下角机器人） |
| `frontend/src/config/modules/headerBar.ts` | `headerBar.fastEnter.enabled` / `headerBar.chat.enabled` | 均 `false` |
| `frontend/src/config/modules/fastEnter.ts` | 快速入口应用列表 | 重写为只保留「工作台」 |
| `frontend/src/utils/sys/console.ts` | 欢迎语 | 改为本项目文案 |

> `frontend/src/utils/constants/links.ts` 的 `WEB_LINKS`（全是 artd.pro / github 外链）已无引用者。

---

## 8. 授权页样式

### `frontend/src/views/auth/login/style.css`（**授权页容器样式的唯一来源**）
- `.auth-right-wrap`：`absolute inset-0 w-[440px] h-[650px] py-[5px] m-auto overflow-hidden max-sm:px-7 max-sm:w-full animate-[slideInRight_0.6s...]`
- `.form`：`h-full py-[40px]`
- `.title`：`text-g-900 text-4xl font-semibold max-md:text-3xl max-sm:pt-10`
- `.sub-title`：`mt-[10px] text-g-600 text-sm`
- `.custom-height`：`!h-[40px]`

### `frontend/src/views/auth/register/index.vue`（**本轮修改**）
- **恢复上游基线的 `<style scoped>@import '../login/style.css';</style>`**（此前被我们重写时删掉，导致容器无宽度约束、输入框横向铺满、标题贴顶）。
- `ElForm` class 由 `mt-7.5` 改为 `auth-form`（`margin-top: 25px`，与登录页一致）。
- 字段：displayName / email / password / confirmPassword，均带 `custom-height`。

### `frontend/src/views/auth/login/index.vue`（**本轮修改**）
- 「还没有账号？注册」整块包在 `v-if="authStore.registrationEnabled"` 内。
- `onMounted` 调 `authStore.loadAuthConfig()`。

---

## 9. 视图

### `frontend/src/views/dashboard/index.vue`（**本轮整体重写**）
- 只保留「工作台」标题 + 副标题（`dashboard.title` / `dashboard.subtitle`），`defineOptions({ name: 'DashboardWorkbench' })`。
- 已移除：临时页头、access token/Cookie 会话说明、账号卡片、退出按钮。

---

## 10. 已知遗留 / 待办

1. `frontend/src/utils/constants/links.ts` 的 `WEB_LINKS` 已无引用者，可删可留。
2. `frontend/src/utils/navigation/route.ts` 的 `isIframe` 仍在被侧栏引用（`isIframe(route.path)`），未清理。
3. 顶栏「通知」按钮带红点（上游演示数据），是否保留待产品确认。
4. `src/components/core/layouts/art-settings-panel` 设置面板仍可用（含复制配置等上游调试项），本轮未裁剪。

---

## 11. 任务模块（CP7 新增）

### `frontend/src/mock/tasks.ts`（**本轮新增**）
本轮「我的任务」的全部数据来源，独立于后端。

导出的类型：
- `TaskStatus = 'pending' | 'in_review' | 'completed'`（待核对 / 核对中 / 已完成）
- `CustomerType = 'general' | 'small' | 'tech'`（一般 / 小微 / 科创）
- `TaskMaterialType = 'charter' | 'license' | 'financial'`（公司章程 / 营业执照 / 财务报表）
- `TaskMaterial { id, name, type }`
- `ReviewTask { id, companyName, customerType, status, createdAt, materials }`
- `TaskListQuery { companyName, status }`（`status` 为 `'all'` 表示不限）

导出的常量：
- `TASK_STATUS_TEXT` / `TASK_STATUS_TAG`（status → 文案 / 标签色）/ `CUSTOMER_TYPE_TEXT` / `MATERIAL_TYPE_TEXT`
- `TASK_STATUS_OPTIONS`（含「全部」，value `'all'`）/ `CUSTOMER_TYPE_OPTIONS`

导出的函数：
| 函数 | 输入 | 输出 | 说明 |
| --- | --- | --- | --- |
| `listTasks(query)` | `TaskListQuery` | `ReviewTask[]` | 按条件过滤（企业名称子串匹配且忽略首尾空格；状态 `'all'` 不限） |
| `listAllTasks()` | 无 | `ReviewTask[]` | 不过滤 |
| `getTaskById(id)` | `string` | `ReviewTask \| undefined` | 按 ID 查任务 |
| `getTaskMaterials(id)` | `string` | `TaskMaterial[]` | 取任务材料（不存在返回 `[]`） |
| `hasCharter(task)` | `ReviewTask` | `boolean` | 是否已上传公司章程 |
| `createTask({companyName, customerType})` | 入参 | `ReviewTask` | 生成独立 ID（`T` + 时间戳 36 进制 + 随机串）、`createdAt = new Date().toISOString()`、`status = 'pending'`、`materials = []`，并 **unshift 到列表顶部** |
| `setListQuery(query)` / `getListQuery()` | `TaskListQuery` | — | 读写列表筛选条件（随任务数据一起存 sessionStorage） |
| `matchTask(task, query)` | | `boolean` | 判断任务是否命中筛选条件（新建后判断是否需要清筛选时用） |
| `formatTaskTime(iso)` | `string` | `string` | `YYYY-MM-DD HH:mm` |

持久化：
- key `compliance-task-mock`（sessionStorage），单个对象 `{ tasks, query }`。
- 读失败 / 首次进入 → 回退到 `SEED_TASKS`（4 条，覆盖待核对 / 核对中 / 已完成，其中一条同时关联「公司章程」+「营业执照」）。
- **同标签页**刷新保留数据与筛选条件；**新标签页 / 新会话**回到种子样例。

### `frontend/src/views/tasks/list/index.vue`（**本轮新增**，组件名 `TaskList`）
- 结构：`TaskSearch`（搜索栏）→ `ElCard.art-table-card` 内含 `ArtTableHeader`（左插槽放「新建任务」按钮与「当前为模拟数据」标签）+ `ArtTable`（有数据时）/ 空状态块（无数据时）。
- 列（`useTableColumns`）：`companyName`（插槽，含任务编号）、`customerType`（插槽，`ElTag`）、`status`（插槽，`ElTag`）、`createdAt`（`formatter` 调 `formatTaskTime`）、`operation`（插槽，按状态给「开始 / 继续核对 / 查看」）。
- 空状态：`hasFilter` 为真 → 「未找到符合条件的任务」+「重置筛选」按钮；否则 → 「暂无任务」+「新建任务」按钮。
- 关键实现点：
  - 表格插槽里的 `row` 是 `any`，直接 `TASK_STATUS_TEXT[row.status]` 会触发 TS7053；本轮用 `getStatusText(row)` / `getStatusTagType(row)` / `getCustomerTypeText(row)` / `getActionText(row)` 四个收口函数把类型补回 `ReviewTask`。
  - `onMounted` 时 `searchForm.value = getListQuery()` 恢复上次筛选条件，再 `refreshData()`。
  - `handleCreate`：`createTask` 后若 `!matchTask(task, searchForm.value)`（新任务会被当前筛选隐藏）→ 清空筛选 + `setListQuery` + 提示「已清除筛选条件，可直接查看新任务」。
  - `goWorkbench(row)` → `router.push({ name: 'TaskWorkbench', params: { taskId: row.id } })`。

### `frontend/src/views/tasks/list/modules/task-search.vue`（**本轮新增**）
- 封装 `ArtSearchBar`：两个表单项 —— 企业名称（`input`）、任务状态（`select`，options 用 `TASK_STATUS_OPTIONS`）。
- `v-model` 透传父组件的 `TaskListQuery`；`@search` 抛 `{ companyName: trim 后, status }`；`@reset` 抛 `reset`。
- **注意**：`ArtSearchBar` 内部 `initialModelValue` 快照在 setup 时捕获，`reset` 时会恢复该快照而非清空；因此「重置」的最终语义由列表页的 `handleReset` 决定（把 `searchForm` 置为 `{ companyName: '', status: 'all' }`），不依赖搜索栏内部快照。

### `frontend/src/views/tasks/list/modules/task-create-dialog.vue`（**本轮新增**）
- `ElDialog`（`width="480px"`, `align-center`, `close-on-click-modal=false`）+ `ElForm`。
- 字段：`companyName`（`required` + `whitespace: true`，提交时 `trim()`）、`customerType`（`required`）。
- 防重复提交：`submitting` 标志 + 提交按钮 `loading`；`handleClosed` 清理表单并 `clearValidate`。
- **本轮验收修复**：`handleSubmit` 原先把 `submitting.value = true` 放在 `await formRef.value.validate()` **之后**，
  连击两次「创建」时两次调用都能越过 `submitting` 判断 → 创建了两条任务；现已改为**先上锁、再校验**
  （`submitting.value = true` 提到 `await` 之前，`finally` 复位）。改动位置：`handleSubmit`（第 79–96 行）。
- 通过 `v-model:visible` 控制显隐，`@submit` 抛 `{ companyName, customerType }`。

### `frontend/src/views/tasks/workbench/index.vue`（**本轮新增**，组件名 `TaskWorkbench`）
- `taskId` 取自 `route.params.taskId`（`computed`），`task = computed(() => getTaskById(taskId.value))`。
- 任务不存在 → `ElResult`（`icon="warning"`）+「返回我的任务」按钮。
- 存在时展示企业名称、客户类型、任务状态、创建时间、任务编号；`status === 'completed'` 时追加「只读」标签。
- 没有公司章程 → 顶部 `ElAlert`（`type="warning"`）「尚未上传公司章程」。
- 材料切换用 `ElTabs type="card"`，**同一内容区替换显示**；公司章程面板显示「章程核对区域占位」`ElAlert`（原文 / 摘录与出处 / 接受或拒绝占位），其他材料面板显示「本轮暂未开放核对」`ElAlert`。
- `watch(task)` 同步 `activeMaterial`（保证选中项有效）并调 `worktabStore.updateTabTitle(route.path, companyName)`，使顶部标签页标题跟随当前任务，**切换任务后不残留上一条任务信息**。
- `goTaskList()` → `router.push({ name: 'TaskList' })`；列表页从 sessionStorage 恢复筛选条件，返回后搜索词与状态筛选仍在。

### `frontend/src/router/routes/staticRoutes.ts`（**本轮修改**）
- 新增导出 `TASK_PATH = '/tasks'`（同时用作侧栏菜单路径与工作台 `activePath`）。
- 新增父路由 `/tasks`（`name: 'Tasks'`, component = `@views/index/index.vue` 即 AppLayout），两个子路由：
  - `''` → `TaskList` → `@views/tasks/list/index.vue`，`meta.title = 'menus.tasks.list.title'`
  - `':taskId/workbench'` → `TaskWorkbench` → `@views/tasks/workbench/index.vue`，`meta.title = 'menus.tasks.workbench.title'`，`meta.activePath = TASK_PATH`
- `staticMenuList` 追加「我的任务」项：`{ path: TASK_PATH, name: 'TaskList', component: '/tasks/list/index', meta: { title: 'menus.tasks.title', icon: 'ri:file-list-3-line' } }`。
  - 顺序：工作台在前 → `getFirstMenuPath` 仍解析为 `/dashboard`，首页路径不变。
  - `component` 字段是侧栏 `SidebarSubmenu.isNavigableRoute` 判定叶子可导航的必要条件。

### `frontend/src/locales/langs/zh.json` / `en.json`（**本轮修改**）
- `menus.tasks` = `{ title, list: { title }, workbench: { title } }`；zh：`我的任务 / 任务列表 / 工作台`；en：`My Tasks / Task List / Review Workbench`。

---

## 12. CP8.1 · OCR 材料预览前端原型（本轮新增 / 修改）

### `frontend/src/mock/previews.ts`（**本轮新建**）
- 作用：OCR 材料预览的**前端模拟数据模块**，只提供合成样例（页图 + 该页模拟 OCR 文字）。
- 导出类型：`PreviewPage{pageNo, image, text}`、`PreviewSample{pages}`。
- 导出函数：`getPreviewSample(taskId: string, materialId: string): PreviewSample | undefined`
  —— 按 `` `${taskId}::${materialId}` `` 查索引，**没有样例时返回 undefined**（页面据此显示「暂无预览数据」）。
- 内部实现：`esc()` / `wrapText()` / `frame()`（页面外框与页脚）/ `buildDocumentPage()`（证照类「标签-值」行 + 合成印章）/ `buildTablePage()`（表格页）/ `toDataUri()`。
- **坑（已修）**：`frame()` 必须输出**完整的 SVG 文档**（含根 `<svg xmlns=... width height viewBox>`）。
  早期版本只拼接子元素，作为 `<img>` 的 data URI 会 `EncodingError: The source image cannot be decoded.`，
  页图渲染为 24px 空 alt 文本 → 原件栏无法滚动，且触发 `[ResourceError]` 控制台错误。
- 样例索引 `PREVIEW_SAMPLES`：
  - `'T2026001::M2026001-2'` → 营业执照，**单页**（`licenseRows` 12 组标签/值 + `licenseText`）
  - `'T2026001::M2026001-3'` → 财务报表，**3 页**（`financialPage1/2/3` 表头 + 数据行，文字由 `buildTableText()` 派生）
- 其余材料（`T2026003::*`、`T2026004::*`、`M2026001-1` 公司章程）**没有**样例 → 显示「暂无预览数据」。
- 全部为合成数据，未引用任何旧工作区的真实 PDF / OCR 结果 / 客户数据。

### `frontend/src/mock/tasks.ts`（**本轮修改 3 处**）
- `STORAGE_KEY`：`'compliance-task-mock'` → **`'compliance-task-mock-v2'`**（补挂了新材料，键名顺延一版让旧会话也拿到新样例材料）。
- 种子 `T2026001` 材料列表改为 3 份：`M2026001-1 公司章程` / `M2026001-2 营业执照` / `M2026001-3 财务报表`。
- `SEED_TASKS` 注释补充各条种子的用途（T2026001 预览样例主入口 / T2026002 无材料空态 / T2026004 只读入口）。
- 其余导出（`TASK_STATUS_TEXT`、`MATERIAL_TYPE_TEXT`、`getTaskById`、`hasCharter` 等）未变。

### `frontend/src/views/tasks/workbench/index.vue`（**本轮改造**）
- 模板：材料切换卡片由「`ElTabPane` 内放占位 Alert」改为 **`ElTabs`（只做材料选择）+ 下方一套 `.task-preview` 预览区**：
  - 工具栏：当前材料名 + `MATERIAL_TYPE_TEXT` 标签 + 「OCR 文字仅供阅读」提示 + 翻页控件（上一页 / 页码 / 下一页）。
  - 预览主体 `.task-preview__body`：`v-if="currentPage"` 时渲染双栏（`.task-preview__pane--image` 放 `img`，`.task-preview__pane--text` 放 `pre`）；否则渲染 `.task-preview__empty`（`ElEmpty`「暂无预览数据」）。
  - 保留：任务信息卡、「尚未上传公司章程」Alert、`v-else` 无材料卡（「该任务尚未上传任何材料」）、任务不存在的 `ElResult`。
- script 新增：
  - `import { getPreviewSample } from '@/mock/previews'`、`import { MATERIAL_TYPE_TEXT } from '@/mock/tasks'`。
  - 状态：`pageNo = ref(1)`、`imagePaneRef` / `textPaneRef`（`HTMLElement | null`）。
  - 计算属性：`currentMaterial`（按 `activeMaterial` 找材料）、`previewSample`（按 `taskId::materialId` 取样例）、
    `hasSample`、`totalPages`、`currentPage`（`pages[pageNo-1]`）、`pageLabel`（无样例时显示「暂无页码」）。
  - 方法：`resetScroll()`（`nextTick` 后把两栏 `scrollTop` 置 0）、`prevPage()` / `nextPage()`（越界不动作）。
  - `watch(activeMaterial)` → `pageNo = 1` + `resetScroll()`；`watch(pageNo)` → `resetScroll()`（翻页回顶部）。
  - `watch(task)` 逻辑不变（同步 `activeMaterial` + `worktabStore.updateTabTitle`）。
- style 新增 `.task-preview*` 系列；**移除**已废弃的 `.task-material` / `.task-material__title`。
  - `.task-preview__body`：`grid-template-columns: minmax(0,1fr) minmax(0,1fr)`；`@media (max-width: 768px)` 改单列。
  - `.task-preview__pane`：`height: clamp(320px, 52vh, 560px); overflow: auto`（窄屏 320px），两栏各自独立滚动。

---

## 13. 本轮读过的上游源码（定位用）

| 文件 | 借鉴点 |
| --- | --- |
| 上游 `src/views/examples/tables/basic.vue` | `ArtTable` 的 `data` / `columns` / `pagination` 绑定方式 |
| 上游 `src/views/examples/tables/index.vue` | `useSlot: true` + 具名插槽（`#avatar` / `#status` / `#operation`）的列渲染写法 |
| 上游 `src/views/system/user/index.vue` | 「搜索栏 + `ArtTableHeader` + `ArtTable` + 弹窗」四段式列表页结构 |
| 上游 `src/views/system/user/modules/user-search.vue` | `ArtSearchBar` 封装与 `SearchFormItem` 配置（`type: 'input' / 'select'`、`props.options`） |
| 上游 `src/views/system/user/modules/user-dialog.vue` | `ElDialog` + `ElForm` + `rules` 的表单弹窗写法 |
| 上游 `src/views/examples/tables/index.vue`（ElCollapse 段） | 「单展开区替换显示」的交互参考（本轮用 `ElTabs` 实现材料切换） |

> 与 `docs/ADP_MAP.md` 的差异：本轮新增的 `src/views/tasks/**` 与 `src/mock/tasks.ts` 是本工程自建，上游不存在；上游 `src/views/examples/**`、`src/views/system/**` 在当前工程已被删除，故其范式需用 `git show 00c7e78:...` 查看。

## 14. CP8.2 · 压缩核对工作台 + 真实 PDF 预览（本轮已改文件索引）

| 文件 | 暴露的函数 / 组件 / 类型 | 与本轮的关系 | 修改位置 |
| --- | --- | --- | --- |
| `frontend/src/views/tasks/workbench/index.vue` | `TaskWorkbench`（默认导出组件）；内部计算属性 `task` / `currentMaterial` / `materialFormat` / `isPdf` / `isImage` / `pdfSource` / `imageSource` / `previewSample` / `ocrPages` / `totalPages` / `pageImage` / `currentText` / `hasSource` / `pageLabel` / `zoomLabel` / `isFitWidth`；方法 `prevPage` / `nextPage` / `zoomIn` / `zoomOut` / `fitWidth` / `handlePdfPageChange` / `handlePdfTotalChange` / `handlePdfZoomChange` / `handlePdfError` / `goTaskList` | 工作台页面。紧凑任务栏 + 原文区（图片 / PDF / 页图三分支）+ 识别文字区 | 整文件重写：`task-workbench__bar`（紧凑栏）、`task-preview__toolbar`（页码 / 翻页 / 缩放）、`task-preview__source` + `task-preview__text-col` 双列（去掉 `clamp(320px,52vh,560px)` 固定高度，改 `flex:1; min-height:0`） |
| `frontend/src/components/business/pdf-viewer/index.vue` | `PdfViewer`（默认导出）；props `source`；emits `page-change` / `total-change` / `zoom-change` / `load-error`；expose `goToPage` / `zoomIn` / `zoomOut` / `fitWidth` / `reload` | PDF.js 渲染真实 PDF：默认适应宽度、连续滚动、页码跟随滚动、翻页滚动到对应页、缩放后仍停在当前页 | 新建。模块顶层 `GlobalWorkerOptions.workerSrc = workerUrl`（`import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'`） |
| `frontend/src/mock/tasks.ts` | 新增 `MaterialFormat = 'image' \| 'pdf' \| 'pages'`；`TaskMaterial` 增加 `format` / `source`；`STORAGE_KEY` 升到 `compliance-task-mock-v3` | 材料「原件格式 + 原件地址」维度；种子 `T2026001` 挂 PDF（`M2026001-1`）与 PNG（`M2026001-4`）样例 | 类型区、`STORAGE_KEY`、`SEED_TASKS` |
| `frontend/src/mock/previews.ts` | 新增 `OcrPage`；新增 `getOcrPages(taskId, materialId)`；保留 `getPreviewSample` | 把「识别文字」与「页图」解耦：PDF 样例无识别结果 → 右栏「暂无识别结果」 | `OCR_TEXTS` 索引 + `getOcrPages` |
| `frontend/src/locales/langs/zh.json` | `menus.tasks.workbench.title` | 面包屑统一为「我的任务 / 核对工作台」 | `menus.tasks.workbench.title`：`工作台` → `核对工作台` |
| `frontend/src/assets/styles/core/hover.scss` | 全局 `.el-button` hover 反馈 + `.art-hover-lift` / `.art-hover-soft` 工具类 | 用户附带的按钮观感优化（非本轮主线） | 新建；在 `frontend/src/assets/styles/index.scss` 末尾 `@use` |
| `frontend/scripts/generate-sample-materials.mjs` | `main()`；`buildImageHtml()` / `buildPdfHtml()` / `runChrome()` | 代码生成纯合成样例原件（无头 Chrome 出 PNG / PDF） | 新建 |
| `frontend/public/samples/license-scan.png`、`frontend/public/samples/charter.pdf` | 静态样例原件（900×1400 PNG / 3 页 PDF） | 工作台样例入口直接引用（`${import.meta.env.BASE_URL}samples/...`） | 新建产物 |
| `frontend/package.json` / `frontend/pnpm-lock.yaml` | 依赖 `pdfjs-dist@6.5.438` | PDF.js 运行时 | `pnpm add pdfjs-dist` |

### 调用关系（CP8.2）

```text
TaskWorkbench
 ├─ mock/tasks.getTaskById → task / materials(format, source)
 ├─ mock/previews.getPreviewSample → pages 格式的页图序列
 ├─ mock/previews.getOcrPages    → 识别文字（PDF 样例为 undefined）
 └─ PdfViewer(source)
     └─ pdfjs-dist getDocument({url}) → 全局 workerSrc = pdf.worker.min.mjs?url
```

### 与 `docs/ADP_MAP.md` 的差异

- `src/views/tasks/**`、`src/mock/**`、`src/components/business/**`、`src/assets/styles/core/hover.scss`、`frontend/scripts/**` 均为本工程自建，上游 ADP 不存在；上游 `src/views/examples/**`、`src/views/system/**` 在当前工程已删除。
- `pdfjs-dist@6.5.438` 无 `exports` 字段（`main=build/pdf.mjs`），只能深路径导入；Worker 必须是 ESM，故用 `pdf.worker.min.mjs`（1.27MB）而非 `.js`。

### 14.4 生产产物试跑踩坑（验收⑥，非产品缺陷）

1. **pdf.js 渲染依赖 `requestAnimationFrame`**：`pdf.mjs` 的 `InternalRenderTask._scheduleNext()`（`build/pdf.mjs` 约 17990 行）用
   `window.requestAnimationFrame` 调度渲染循环。后台标签页（`document.visibilityState === 'hidden'`）浏览器不执行 rAF →
   `page.render()` 的 promise 永久 pending → 表现为**页码停在「暂无页码」、画布尺寸已设但内容空白、且没有任何报错**
   （Worker 正常握手、`GetOperatorList` 正常返回）。
   排查抓手：`Emulation.setFocusEmulationEnabled{true}` + `Page.bringToFront` 让页面可见后 rAF 恢复，渲染随即正常。
   **后续任何 PDF 渲染验收脚本都必须先激活页面**，否则会误判为「生产构建坏了」。
2. **反向代理必须保留 `Host` 头**：后端 `backend/app/api/deps.py` 的 `require_trusted_origin`（约 43–66 行）用
   `urlparse(origin).netloc == request.headers['host']` 判同源。自写静态服务代理 `/api` 时若把 `Host` 改写成
   `127.0.0.1:8000`，Cookie 写请求会被判「请求来源不被信任」→ 403，`refresh` 永远失败 → 刷新页面即掉登录。
   Vite dev proxy 默认保留 Host，所以开发模式不暴露这个问题。修法：代理转发时**原样透传 `req.headers`**。
3. **`Network.getCookies` 的 `urls` 是按路径匹配的**：cookie 的 `Path=/api/v1/auth` 用 `urls: ['http://host/']` 查不到，
   必须给带路径的 URL（`http://host/api/v1/auth/refresh`）才会命中——否则会误判成「Cookie 没种下」。
4. **`Network.enable` 之后 `Network.getCookies` 才能拿到跨路径 cookie**；`fetch` 的响应头读不到 `set-cookie`（浏览器禁止 JS 读取该头），
   判断 Cookie 是否下发应看 `Network.getCookies` 而非 `fetch` 响应头。
5. **PDF.js Worker 产物核验**：`dist/assets/pdf.worker.min-*.mjs` 与 `node_modules/pdfjs-dist/build/pdf.worker.min.mjs`
   SHA-256 完全一致（`1e64c824…`），说明 Vite 的 `?url` 是原样拷贝，不会因二次打包而损坏 Worker。
