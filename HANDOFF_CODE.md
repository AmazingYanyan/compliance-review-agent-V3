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
- `tests/conftest.py` 提供 `client` fixture（ASGITransport + 内存库）与 `TEST_EMAIL/TEST_PASSWORD/TEST_DISPLAY_NAME`。

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
