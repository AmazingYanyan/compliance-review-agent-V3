# ADP 结构地图（Art Design Pro 上游）

## 1. 头部声明

- **来源 commit**：`f3aaf58eec1a0e988f162352c33862327a484f95`（v3.0.2）
- **生成日期**：2026-11-22
- **重要说明**：这是上游原始结构地图，当前工程已改造，使用前用 `rg --files` 或 `ls` 确认文件是否仍存在。本地图仅用于“去哪儿找”的定位，不代表当前工程的真相。
- **覆盖范围**：`src` 下全部源码目录，包括 `api`、`assets`（仅 `svg/loading.ts`）、`components`、`config`、`directives`、`enums`、`hooks`、`locales`、`mock`、`plugins`、`router`、`store`、`types`、`utils`、`views`，以及根文件 `main.ts`、`App.vue`、`env.d.ts`。
- **路径约定**：全文统一使用 `src/...`（相对仓库根）表示文件路径；仅在第 4.1 节引述源码 `component` 字面值及第 4.4 节 import 路径时，保留 `@/...`、`@views/...` 别名原样（`vite.config.ts` 中 `@`→`src`、`@views`→`src/views`，二者等价）。
- **自检状态**：本文件已基于固定 commit 逐节自检修正；所有职责标注均已读源码核实为"字面"并附依据，原"待确认"项（SVG loading 导出、两个组件 name）已据源码关闭。组件 name 标注"推断名"处，系源码 `<script setup>` 无显式 `defineOptions({ name })`、由文件名推断，故如实保留。
- **未覆盖目录及原因**：
  - `src/assets/images/**`、`src/assets/styles/**`：纯静态图片/样式资源目录（png/svg/scss），无源码签名或类型可索引，按规则跳过。
  - `src/types/import/auto-imports.d.ts`、`src/env.d.ts` 内部声明：unplugin-auto-import 自动生成的大段全局声明，仅记录文件职责与顶层结构，未逐条展开内部声明。

## 2. 目录树（src，2～3 层）

```
src
├── api/                       auth.ts, system-manage.ts
├── assets/
│   ├── images/                （纯图片资源，未覆盖）
│   ├── styles/                （纯样式资源，未覆盖）
│   └── svg/                   loading.ts
├── components/
│   ├── business/
│   │   └── comment-widget/    index.vue, widget/
│   └── core/
│       ├── banners/           art-basic-banner/, art-card-banner/
│       ├── base/              art-back-to-top/, art-logo/, art-svg-icon/
│       ├── cards/             art-*-chart-card, art-data-list-card, art-image-card 等 8 个
│       ├── charts/            art-bar-chart, art-k-line-chart, art-map-chart 等 9 个
│       ├── forms/             art-form, art-search-bar, art-excel-* 等 8 个
│       ├── layouts/           art-menus/, art-header-bar/, art-settings-panel/ 等
│       ├── media/             art-cutter-img/, art-video-player/
│       ├── others/            art-menu-right/, art-watermark/
│       ├── tables/            art-table/, art-table-header/
│       ├── text-effect/       art-count-to/, art-text-scroll/, art-festival-text-scroll/
│       ├── theme/             theme-svg/
│       ├── views/             exception/, login/, result/
│       └── widget/            art-icon-button/
├── config/
│   ├── assets/                images.ts
│   ├── modules/               component.ts, fastEnter.ts, festival.ts, headerBar.ts
│   ├── index.ts
│   └── setting.ts
├── directives/
│   ├── business/              highlight.ts, ripple.ts
│   ├── core/                  auth.ts, roles.ts
│   └── index.ts
├── enums/                     appEnum.ts, formEnum.ts
├── hooks/
│   ├── core/                  useAuth.ts, useTable.ts, useTheme.ts 等 12 个
│   └── index.ts
├── locales/
│   ├── langs/                 zh.json, en.json
│   └── index.ts
├── mock/
│   ├── json/                  chinaMap.json
│   ├── temp/                  articleList.ts, commentList.ts 等 4 个
│   ├── upgrade/               changeLog.ts
├── plugins/                   echarts.ts, index.ts
├── router/
│   ├── core/                  RouteRegistry.ts 等 8 个
│   ├── guards/                beforeEach.ts, afterEach.ts
│   ├── modules/               dashboard.ts, system.ts 等 11 个
│   ├── routes/                staticRoutes.ts, asyncRoutes.ts
│   ├── index.ts
│   └── routesAlias.ts
├── store/
│   ├── modules/               user.ts, menu.ts, setting.ts, table.ts, worktab.ts
│   └── index.ts
├── types/
│   ├── api/                   api.d.ts
│   ├── common/                index.ts, response.ts
│   ├── component/             chart.ts, index.ts
│   ├── config/                index.ts
│   ├── directive/             directive.d.ts
│   ├── import/                auto-imports.d.ts
│   ├── router/                index.ts
│   ├── store/                 index.ts
│   └── index.ts
├── utils/
│   ├── constants/             index.ts, links.ts
│   ├── form/                  index.ts, validator.ts, responsive.ts
│   ├── http/                  index.ts, error.ts, status.ts
│   ├── navigation/            index.ts, jump.ts, route.ts, worktab.ts
│   ├── socket/                index.ts
│   ├── storage/               index.ts, storage.ts, storage-config.ts, storage-key-manager.ts
│   ├── sys/                   index.ts, console.ts, error-handle.ts, mittBus.ts, upgrade.ts
│   ├── table/                 tableCache.ts, tableConfig.ts, tableUtils.ts
│   ├── ui/                    index.ts, animation.ts, colors.ts, emojo.ts, iconify-loader.ts, loading.ts, tabs.ts
│   ├── index.ts
│   └── router.ts
├── views/
│   ├── article/               comment/, detail/, list/, publish/
│   ├── auth/                  forget-password/, login/, register/
│   ├── change/                log/
│   ├── dashboard/             analysis/, console/, ecommerce/（各含 modules/）
│   ├── examples/              forms/, permission/, socket-chat/, tables/, tabs/
│   ├── exception/             403/, 404/, 500/
│   ├── index/                 index.vue（布局容器）
│   ├── outside/               Iframe.vue
│   ├── result/                fail/, success/
│   ├── safeguard/             server/
│   ├── system/                menu/, nested/, role/, user/, user-center/
│   ├── template/              banners/, calendar/, cards/, charts/, chat/, map/, pricing/
│   └── widgets/               context-menu/, count-to/, drag/, excel/, fireworks/, icon/ 等 12 个
├── main.ts
├── App.vue
└── env.d.ts
```

## 3. 按目录分节的文件索引

### 3.0 根文件

`src/main.ts`
- 职责（字面）：应用入口，创建并挂载 Vue app，安装 store/router/指令/错误处理/i18n。
- Export：无导出（入口文件）；顶层调用 `createApp(App)`、`initStore`、`initRouter`、`setupGlobDirectives`、`setupErrorHandle`、`app.use(language)`、`app.mount('#app')`（字面）
- 备注：`initRouter(app)` 为路由初始化入口。

`src/App.vue`
- 职责（字面）：根组件，以 ElConfigProvider 包裹 RouterView，并在生命周期初始化主题/存储兼容/升级检查。
- Export：无显式 defineOptions/defineEmits/defineExpose；顶层 `const userStore = useUserStore()`、`const { language } = storeToRefs(userStore)`、`const locales = { zh, en }`（字面）
- 备注：RouterView 为根路由出口；从 userStore 取 language 决定 Element Plus 语言。

`src/env.d.ts`
- 职责（字面）：环境类型声明，含 vite/client 引用、若干无类型模块声明、qrcode.vue 类型与全局变量。
- Export：无运行时导出；`declare module 'nprogress' | 'crypto-js' | 'vue-img-cutter' | 'file-saver'`（字面）；`declare module 'qrcode.vue'` 含 `Level`/`RenderAs`/`GradientType`/`ImageSettings`/`QRCodeProps` 类型及默认导出 `QrcodeVue`（字面）；`__APP_VERSION__: string`（字面）

### 3.1 src/api

`src/api/auth.ts`
- 职责（字面）：认证接口封装（登录、获取用户信息）。
- Export：
  - `fetchLogin(params: Api.Auth.LoginParams)` — POST `/api/auth/login`，返回 `Api.Auth.LoginResponse`（字面）
  - `fetchGetUserInfo()` — GET `/api/user/info`，返回 `Api.Auth.UserInfo`（字面）
- 备注：认证相关。

`src/api/system-manage.ts`
- 职责（字面）：系统管理接口封装（用户列表、角色列表、菜单列表）。
- Export：
  - `fetchGetUserList(params: Api.SystemManage.UserSearchParams)` — GET `/api/user/list`（字面）
  - `fetchGetRoleList(params: Api.SystemManage.RoleSearchParams)` — GET `/api/role/list`（字面）
  - `fetchGetMenuList()` — GET `/api/v3/system/menus`，返回 `AppRouteRecord[]`（字面）
- 备注：菜单数据来源（后端模式下供 MenuProcessor 调用）。

### 3.2 src/router

`src/router/index.ts`
- 职责（字面）：创建路由实例并初始化；history 为 createWebHashHistory，routes 为静态路由。
- Export：
  - `router` — `createRouter(...)` 实例（字面）
  - `initRouter(app: App<Element>): void` — 配置进度条、注册前置/后置守卫、`app.use(router)`（字面）
  - `HOME_PAGE_PATH = ''` — 主页路径配置（字面）
- 备注：路由核心入口。

`src/router/routesAlias.ts`
- 职责（字面）：公共路由别名枚举。
- Export：
  - `RoutesAlias` — enum：`Layout = '/index/index'`、`Login = '/auth/login'`（字面）
- 备注：路由/布局相关（布局容器与登录页路径）。

`src/router/routes/staticRoutes.ts`
- 职责（字面）：静态路由配置（不需要权限即可访问）。
- Export：
  - `staticRoutes: AppRouteRecordRaw[]` — 路由数组（字面，类型来自 `@/utils/router`，`staticRoutes.ts:1,13`；内容见第 4.1 节）
- 备注：认证/路由相关（登录、注册、忘记密码、403/404/500、iframe 外链）。

`src/router/routes/asyncRoutes.ts`
- 职责（字面）：动态路由，用于渲染菜单及按权限加载；值为 `routeModules`。
- Export：
  - `asyncRoutes: AppRouteRecord[]` — `= routeModules`（字面）
- 备注：路由/菜单相关。

`src/router/guards/beforeEach.ts`
- 职责（字面）：路由全局前置守卫——登录状态验证和重定向、动态路由注册和权限控制、菜单获取处理、用户信息获取、标题设置、工作标签页管理、进度条/loading 控制（顶部 JSDoc「主要功能」）。
- Export：
  - `getPendingLoading(): boolean`（字面）
  - `resetPendingLoading(): void`（字面）
  - `getRouteInitFailed(): boolean`（字面）
  - `resetRouteInitState(): void`（字面）
  - `setupBeforeEachGuard(router: Router): void`（字面）
  - `resetRouterState(delay: number): void`（字面）
  - 内部函数：`handleRouteGuard`、`handleLoginStatus`、`isStaticRoute`、`handleDynamicRoutes`、`fetchUserInfo`、`handleRootPathRedirect`、`isUnauthorizedError`（字面）
- 备注：认证核心（未登录跳 Login 带 redirect；401 由 axios 拦截器处理退出登录）。

`src/router/guards/afterEach.ts`
- 职责（字面）：路由全局后置守卫——滚动到顶部、关闭进度条、关闭 loading。
- Export：
  - `setupAfterEachGuard(router: Router)`（字面）
- 备注：路由相关。

`src/router/modules/index.ts`
- 职责（字面）：汇总所有模块化路由为 `routeModules`。
- Export：
  - `routeModules: AppRouteRecord[]` — 由 10 组路由（dashboard/template/widgets/examples/system/article/result/exception/safeguard + help）组成（字面）

`src/router/modules/dashboard.ts`
- 职责（字面）：仪表盘路由模块。
- Export：`dashboardRoutes: AppRouteRecord` — `/dashboard`，name Dashboard，component `/index/index`，roles `[R_SUPER, R_ADMIN]`，子路由 console/analysis/ecommerce（字面）

`src/router/modules/template.ts`
- 职责（字面）：模板中心路由模块。
- Export：`templateRoutes: AppRouteRecord` — `/template`，子路由 cards/banners/charts/map/chat/calendar/pricing（字面）

`src/router/modules/widgets.ts`
- 职责（字面）：组件中心路由模块。
- Export：`widgetsRoutes: AppRouteRecord` — `/widgets`，子路由 icon/image-crop/excel/video/count-to/wang-editor/watermark/context-menu/qrcode/drag/text-scroll/fireworks + ElementUI iframe 外链（字面）

`src/router/modules/examples.ts`
- 职责（字面）：功能示例路由模块。
- Export：`examplesRoutes: AppRouteRecord` — `/examples`，含 permission（switch-role/button-auth/page-visibility）、tabs、tables/basic、tables、forms、form/search-bar、tables/tree、socket-chat（字面）
- 备注：权限相关（button-auth 带 authList、page-visibility roles `[R_SUPER]`）。

`src/router/modules/system.ts`
- 职责（字面）：系统管理路由模块。
- Export：`systemRoutes: AppRouteRecord` — `/system`，roles `[R_SUPER, R_ADMIN]`，子路由 user/role/user-center/menu + nested 多级嵌套（字面）
- 备注：认证/菜单相关（role/menu 带 roles 与 authList，user-center isHide）。

`src/router/modules/article.ts`
- 职责（字面）：文章管理路由模块。
- Export：`articleRoutes: AppRouteRecord` — `/article`，子路由 article-list/detail/:id/comment/publish（字面）
- 备注：article-list/publish 带 authList。

`src/router/modules/result.ts`
- 职责（字面）：结果页路由模块。
- Export：`resultRoutes: AppRouteRecord` — `/result`，子路由 success/fail（字面）

`src/router/modules/exception.ts`
- 职责（字面）：异常页路由模块。
- Export：`exceptionRoutes: AppRouteRecord` — `/exception`，子路由 403/404/500（均 isHideTab + isFullPage）（字面）

`src/router/modules/safeguard.ts`
- 职责（字面）：运维管理路由模块。
- Export：`safeguardRoutes: AppRouteRecord` — `/safeguard`，子路由 server（字面）

`src/router/modules/help.ts`
- 职责（字面）：帮助中心路由（含外链与更新日志）。
- Export：`helpRoutes: AppRouteRecord[]` — Document/LiteVersion/OldVersion 外链（link + isIframe:false）+ ChangeLog `/change/log`（字面）

`src/router/core/index.ts`
- 职责（字面）：路由核心模块统一导出。
- Export：`export { RouteRegistry, ComponentLoader, RouteValidator, RouteTransformer, IframeRouteManager, MenuProcessor, RoutePermissionValidator }`（字面）

`src/router/core/RouteRegistry.ts`
- 职责（字面）：路由注册核心类，负责动态路由的注册、验证和管理。
- Export：
  - `class RouteRegistry` — `constructor(router: Router)`；方法 `register(menuList): void`、`unregister(): void`、`isRegistered(): boolean`、`getRemoveRouteFns(): (() => void)[]`、`markAsRegistered(): void`（字面）
- 备注：路由相关。

`src/router/core/ComponentLoader.ts`
- 职责（字面）：组件加载器，通过 `import.meta.glob('../../views/**/*.vue')` 动态加载视图组件。
- Export：
  - `class ComponentLoader` — 方法 `load(componentPath: string): () => Promise<any>`、`loadLayout(): () => Promise<any>`、`loadIframe(): () => Promise<any>`；私有 `createEmptyComponent`、`createErrorComponent`（字面）
- 备注：路由/布局相关（loadLayout → `/index/index`，loadIframe → Iframe.vue）。

`src/router/core/RouteValidator.ts`
- 职责（字面）：路由验证器，验证路由配置合法性（重复路由、组件配置、嵌套 Layout 检测）。
- Export：
  - `interface ValidationResult` — `{ valid: boolean; errors: string[]; warnings: string[] }`（字面）
  - `class RouteValidator` — 方法 `validate(routes: AppRouteRecord[]): ValidationResult`（字面）

`src/router/core/RouteTransformer.ts`
- 职责（字面）：路由转换器，将菜单数据（AppRouteRecord）转换为 Vue Router 路由配置。
- Export：
  - `class RouteTransformer` — `constructor(componentLoader: ComponentLoader)`；方法 `transform(route: AppRouteRecord, depth = 0): ConvertedRoute`（字面）
  - 内部 `interface ConvertedRoute`（字面）
- 备注：路由相关（区分 iframe/一级/普通路由，一级用 Layout 包裹）。

`src/router/core/MenuProcessor.ts`
- 职责（字面）：菜单处理器，负责菜单数据的获取（前端/后端模式）、过滤和处理。
- Export：
  - `class MenuProcessor` — 方法 `async getMenuList(): Promise<AppRouteRecord[]>`、`validateMenuList(menuList): boolean`（字面）
  - 内部：processFrontendMenu/processBackendMenu（后端取 `fetchGetMenuList`）、filterMenuByRoles、filterEmptyMenus、normalizeMenuPaths 等（字面）
- 备注：菜单相关（前端模式按角色过滤 asyncRoutes；后端模式取 api）。

`src/router/core/IframeRouteManager.ts`
- 职责（字面）：iframe 路由管理器（单例），负责 iframe 类型路由的增删改查与 sessionStorage 持久化。
- Export：
  - `class IframeRouteManager` — `static getInstance()`；方法 `add(route)`、`getAll()`、`findByPath(path)`、`clear()`、`save()`、`load()`（字面）
- 备注：路由相关。

`src/router/core/RoutePermissionValidator.ts`
- 职责（字面）：路由权限验证模块，验证路径是否在用户菜单权限中、构建路径集合、动态参数匹配。
- Export：
  - `class RoutePermissionValidator`（静态方法）— `hasPermission`、`buildMenuPathSet`、`checkPathPrefix`、`matchRoute`、`isDynamicRouteMatch`、`validatePath`（字面）
- 备注：认证/路由相关。

### 3.3 src/store

`src/store/index.ts`
- 职责（字面）：Pinia 实例创建与持久化插件配置（版本化存储键、自动数据迁移）。
- Export：
  - `store` — `createPinia()` 实例，`use(createPersistedState({...}))`（字面）
  - `initStore(app: App<Element>): void`（字面）

`src/store/modules/user.ts`
- 职责（字面）：用户状态管理——登录状态、用户信息、accessToken/refreshToken、语言、搜索历史、锁屏状态与密码、登出清理（顶部 JSDoc「主要功能」，持久化键 `sys-v{version}-user`）。
- Export：
  - `useUserStore = defineStore('userStore', ...)` — 返回 state：`language`/`isLogin`/`isLock`/`lockPassword`/`info`/`searchHistory`/`accessToken`/`refreshToken`；computed：`getUserInfo`/`getSettingState`/`getWorktabState`；方法：`setUserInfo`/`setLoginStatus`/`setLanguage`/`setSearchHistory`/`setLockStatus`/`setLockPassword`/`setToken`/`logOut`/`checkAndClearWorktabs`（字面）
- 备注：认证核心（token 管理、logOut 跳转 Login）。

`src/store/modules/menu.ts`
- 职责（字面）：菜单状态管理——菜单列表、首页路径、菜单宽度、动态路由移除函数（顶部 JSDoc，`menu.ts:1-29`）。
- 备注：源码未声明 `persist` 选项（`menu.ts:41`，对比 user/setting/table/worktab 均有 `persist`），故本 store 不持久化（字面）。
- Export：
  - `useMenuStore = defineStore('menuStore', ...)` — state：`homePath`/`menuList`/`menuWidth`/`removeRouteFns`；方法：`setMenuList`/`getHomePath`/`setHomePath`/`addRemoveRouteFns`/`removeAllDynamicRoutes`/`clearRemoveRouteFns`（字面）
- 备注：菜单/路由相关。

`src/store/modules/setting.ts`
- 职责（字面）：系统设置状态管理——菜单布局、主题、菜单主题样式、界面显示开关、功能开关、样式配置、节日、Element Plus 主题色（顶部 JSDoc，持久化键 `sys-v{version}-setting`）。
- Export：
  - `useSettingStore = defineStore('settingStore', ...)` — state：`menuType`/`menuOpenWidth`/`systemThemeType`/`systemThemeMode`/`menuThemeType`/`systemThemeColor`/`boxBorderMode`/`uniqueOpened`/`showMenuButton`/`showFastEnter`/`showRefreshButton`/`showCrumbs`/`autoClose`/`showWorkTab`/`showLanguage`/`showNprogress`/`colorWeak`/`showSettingGuide`/`pageTransition`/`tabStyle`/`menuOpen`/`refresh`/`watermarkVisible`/`customRadius`/`holidayFireworksLoaded`/`showFestivalText`/`festivalDate`/`dualMenuShowText`/`containerWidth`；computed：`getMenuTheme`/`isDark`/`getMenuOpenWidth`/`getCustomRadius`/`isShowFireworks`；方法含 `switchMenuLayouts`/`switchMenuStyles`/`setGlopTheme`/`setElementTheme`/`reload` 等（字面）
- 备注：布局/菜单相关（菜单布局与主题切换）。

`src/store/modules/table.ts`
- 职责（字面）：表格显示配置状态——尺寸、斑马纹、边框、表头背景、全屏（顶部 JSDoc，持久化键 `sys-v{version}-table`）。
- Export：`useTableStore = defineStore('tableStore', ...)` — state：`tableSize`/`isZebra` 等（字面）

`src/store/modules/worktab.ts`
- 职责（字面）：工作标签页状态管理——打开/关闭、固定、批量关闭、缓存管理、标题自定义、路由验证（顶部 JSDoc，持久化键 `sys-v{version}-worktab`）。
- Export：
  - `useWorktabStore = defineStore('worktabStore', ...)` — 内部 `interface WorktabState`；state：`current`/`opened`/`keepAliveExclude`；computed：`hasOpenedTabs`/`hasMultipleTabs`/`currentTabIndex`；方法：`openTab`/`removeTab`/`removeLeft`/`removeRight`/`removeOthers`/`removeAll`/`toggleFixedTab`/`validateWorktabs`/`clearAll`/`getStateSnapshot`/`findTabIndex`/`getTab`/`isTabClosable`/`addKeepAliveExclude`/`removeKeepAliveExclude`/`markTabsToRemove`/`getTabTitle`/`updateTabTitle`/`resetTabTitle`（字面）
- 备注：路由/布局相关（标签页随路由变化）。

### 3.4 src/config

`src/config/index.ts`
- 职责（字面）：系统全局配置（系统信息、主题样式、菜单配置、颜色方案、快速入口、顶部栏）。
- Export：`default` — `Object.freeze(appConfig): SystemConfig`，字段 `systemInfo`/`systemThemeStyles`/`settingThemeList`/`menuLayoutList`/`themeList`/`darkMenuStyles`/`systemMainColor`/`fastEnter`/`headerBar`（字面）

`src/config/setting.ts`
- 职责（字面）：系统设置默认值配置（顶部 JSDoc；注释指出需同步 SettingActions.vue 与 store/setting.ts）。
- Export：
  - `SETTING_DEFAULT_CONFIG` — 常量对象（menuType/menuOpenWidth/systemThemeType/... 全字段，字面）
  - `getSettingDefaults()`（字面）
  - `resetToDefaults(currentSettings: Record<string, any>)`（字面）

`src/config/modules/component.ts`
- 职责（字面）：全局组件配置——统一管理系统级全局组件注册，支持 `enabled` 开关。
- Export：
  - `globalComponentsConfig: GlobalComponentConfig[]`（字面，内容见第 4 节）
  - `interface GlobalComponentConfig` — `{ name; key; component; enabled?; description? }`（字面）
  - `getEnabledGlobalComponents()`、`getGlobalComponentByKey(key: string)`（字面）

`src/config/modules/headerBar.ts`
- 职责（字面）：顶部栏功能配置对象（各功能模块 enabled 状态）。
- Export：`headerBarConfig: HeaderBarFeatureConfig`（字面，内容见第 4 节）；`default headerBarConfig`（字面）
- 备注：布局相关（顶部栏功能开关）。

`src/config/modules/fastEnter.ts`
- 职责（字面）：快速入口配置（应用列表、快速链接）。
- Export：`default Object.freeze(fastEnterConfig): FastEnterConfig` — `minWidth: 1200`、`applications`（8 项）、`quickLinks`（6 项）（字面）

`src/config/modules/festival.ts`
- 职责（字面）：节日庆祝配置（烟花效果与祝福文本，当前示例均为注释）。
- Export：`festivalConfigList: FestivalConfig[]`（当前为空数组，示例注释保留）（字面）

`src/config/assets/images.ts`
- 职责（字面）：配置中心图片资源对象（主题样式、菜单布局、菜单风格预览图）。
- Export：`configImages` — `{ themeStyles: {light/dark/system}, menuLayouts: {vertical/horizontal/mixed/dualColumn}, menuStyles: {design/dark/light} }`（字面）

### 3.5 src/utils

`src/utils/index.ts`
- 职责（字面）：Utils 统一导出（向后兼容）。
- Export：`export *` from `./ui`/`./router`/`./navigation`/`./sys`/`./constants`/`./storage`/`./http`/`./form`/`./socket`（字面）

`src/utils/router.ts`
- 职责（字面）：路由工具——标题设置、进度条配置、菜单标题格式化。
- Export：
  - `AppRouteRecordRaw` — type `RouteRecordRaw & { hidden?: boolean }`（字面）
  - `configureNProgress()`、`setPageTitle(to: RouteLocationNormalized): void`、`formatMenuTitle(title: string): string`（字面）
- 备注：路由/菜单相关。

`src/utils/constants/index.ts`
- 职责（字面）：常量定义统一导出。
- Export：`export * from './links'`（字面）

`src/utils/constants/links.ts`
- 职责（字面）：网站链接常量配置。
- Export：`WEB_LINKS` — 常量对象含 `GITHUB_HOME`/`GITHUB`/`BLOG`/`DOCS`/`LiteVersion`/`OldVersion`/`COMMUNITY`/`BILIBILI`/`INTRODUCE`（字面）

`src/utils/form/index.ts`
- 职责（字面）：表单工具统一导出。
- Export：`export * from './validator'`、`'./responsive'`（字面）

`src/utils/form/validator.ts`
- 职责（字面）：表单验证工具——字段校验函数。
- Export：
  - `PasswordStrength` — enum `WEAK/MEDIUM/STRONG`（字面）
  - `trimSpaces(value: string): string`、`validatePhone`、`validateTelPhone`、`validateAccount`、`validatePassword`、`validateStrongPassword`、`getPasswordStrength(value): PasswordStrength`、`validateIPv4Address`、`validateEmail`、`validateURL`、`validateChineseIDCard`、`validateBankCard`（均为 `(value: string) => boolean`，字面）
- 备注：含银行卡/身份证校验函数。

`src/utils/form/responsive.ts`
- 职责（字面）：表单响应式布局工具。
- Export：`ResponsiveBreakpoint` — type `'xs'|'sm'|'md'|'lg'|'xl'`（字面）；`calculateResponsiveSpan(itemSpan, defaultSpan, breakpoint): number`；`createResponsiveSpanCalculator(defaultSpan)`（字面）
- 备注：布局相关（表单栅格响应式）。

`src/utils/http/index.ts`
- 职责（字面）：HTTP 请求封装——基于 Axios 的统一请求/响应处理。
- Export：
  - `default` — `api` 对象，方法 `get<T>`/`post<T>`/`put<T>`/`del<T>`/`request<T>`(config: ExtendedAxiosRequestConfig)（字面）
  - 内部 `ExtendedAxiosRequestConfig` — interface extends AxiosRequestConfig，含 `showErrorMessage?`/`showSuccessMessage?`（字面）
  - 内部拦截器/函数：请求拦截（注入 Authorization）、响应拦截（ApiStatus.success/unauthorized）、`createHttpError`、`handleUnauthorizedError`、`resetUnauthorizedError`、`logOut`、`shouldRetry`、`retryRequest<T>`、`delay`、`request<T>`（字面）
- 备注：认证核心（请求拦截注入 accessToken；401 自动登出带防抖）。

`src/utils/http/error.ts`
- 职责（字面）：HTTP 错误处理——统一错误类、转换、日志与消息展示。
- Export：
  - `ErrorResponse` — interface `{ code; msg; data? }`（字面）
  - `ErrorLogData` — interface `{ code; message; data?; timestamp; url?; method?; stack? }`（字面）
  - `class HttpError extends Error` — `constructor(message, code, options?)`，方法 `toLogData(): ErrorLogData`（字面）
  - `handleError(error): never`、`showError(error, showMessage?): void`、`showSuccess(message, showMessage?): void`、`isHttpError(error): error is HttpError`（字面）
- 备注：认证相关（状态码映射含 unauthorized/forbidden）。

`src/utils/http/status.ts`
- 职责（字面）：接口状态码枚举。
- Export：`ApiStatus` — enum `success=200`/`error=400`/`unauthorized=401`/`forbidden=403`/`notFound=404`/.../`gatewayTimeout=504`/`httpVersionNotSupported=505`（字面）
- 备注：认证相关（401/403）。

`src/utils/navigation/index.ts`
- 职责（字面）：路由和导航工具统一导出。
- Export：`export * from './jump'`、`'./worktab'`、`'./route'`（字面）
- 备注：路由/导航相关。

`src/utils/navigation/jump.ts`
- 职责（字面）：导航跳转工具——外链打开与菜单跳转。
- Export：`openExternalLink(link: string)`（字面）；`handleMenuJump(item: AppRouteRecord, jumpToFirst = false)`（字面）
- 备注：路由/菜单相关。

`src/utils/navigation/route.ts`
- 职责（字面）：路由工具——iframe 检测与菜单有效路径解析。
- Export：`isIframe(url: string): boolean`、`isNavigableMenuItem(menuItem): boolean`、`getFirstMenuPath(menuList): string`（字面）
- 备注：路由/菜单相关。

`src/utils/navigation/worktab.ts`
- 职责（字面）：工作标签页管理——根据路由自动创建/更新标签页。
- Export：`setWorktab(to: RouteLocationNormalized): void`（字面）
- 备注：路由/菜单相关。

`src/utils/socket/index.ts`
- 职责（字面，源码字段/方法名）：WebSocket 客户端单例（含重连 `reconnectInterval`、心跳 `heartbeatInterval`、消息队列 `messageQueue`，`socket/index.ts:1-39`）。
- Export：
  - `default` — `class WebSocketClient`（字面）
  - `static getInstance(options: WebSocketOptions): WebSocketClient`、`init(): void`、`close(force?): void`、`send(data, immediate?): void`、`get isWebSocketConnected`、`get connectionStatusText`、`static destroyInstance()`（字面）
  - 内部 `interface WebSocketOptions`（字面）

`src/utils/storage/index.ts`
- 职责（字面）：存储工具统一导出。
- Export：`export * from './storage'`、`'./storage-config'`、`'./storage-key-manager'`（字面）

`src/utils/storage/storage.ts`
- 职责（字面）：存储兼容性管理——数据验证与异常恢复。
- Export：`getSystemStorage()`、`getSysVersion(): string | null`、`validateStorageData(requireAuth = false): boolean`、`checkStorageCompatibility(requireAuth = false): boolean`（字面）；内部 `StorageCompatibilityManager`（字面）
- 备注：认证相关（登录状态验证、异常时系统登出）。

`src/utils/storage/storage-config.ts`
- 职责（字面）：存储配置管理——版本化存储键配置与工具方法。
- Export：
  - `class StorageConfig` — 静态常量 `CURRENT_VERSION`/`STORAGE_PREFIX`/`VERSION_KEY`/`THEME_KEY`/`LAST_USER_ID_KEY`/`RESPONSIVE_MENU_TYPE_KEY`/`SKIP_UPGRADE_VERSION`/`UPGRADE_DELAY`/`LOGOUT_DELAY`；静态方法 `generateStorageKey`/`generateLegacyKey`/`createKeyPattern`/`createCurrentVersionPattern`/`createVersionPattern`/`isCurrentVersionKey`/`isVersionedKey`/`extractVersionFromKey`/`extractStoreIdFromKey`（字面）
- 备注：认证相关（LAST_USER_ID_KEY 判断同用户登录）。

`src/utils/storage/storage-key-manager.ts`
- 职责（字面）：存储键名管理器——版本化键名生成与数据迁移。
- Export：`class StorageKeyManager` — `getStorageKey(storeId: string): string`（字面）

`src/utils/sys/index.ts`
- 职责（字面）：系统管理工具统一导出。
- Export：`export * from './upgrade'`；`export { default as mittBus } from './mittBus'`（字面）

`src/utils/sys/console.ts`
- 职责（字面，源码内容）：控制台启动横幅打印（`asciiArt` ASCII Art + `console.log`，`console.ts:1-8`）。
- Export：无（副作用模块）（字面）

`src/utils/sys/error-handle.ts`
- 职责（字面）：全局错误处理——捕获 Vue/脚本/Promise/资源错误。
- Export：`vueErrorHandler(err, instance, info)`、`scriptErrorHandler(...): boolean`、`registerPromiseErrorHandler()`、`registerResourceErrorHandler()`、`setupErrorHandle(app: App)`（字面）

`src/utils/sys/mittBus.ts`
- 职责（字面）：全局事件总线（基于 mitt 的类型安全事件总线）。
- Export：`default` — `mittBus: Emitter<Events>`（字面）；内部 `Events` type 含 `triggerFireworks`/`openSetting`/`openSearchDialog`/`openChat`/`openLockScreen`（字面）

`src/utils/sys/upgrade.ts`
- 职责（字面）：系统版本升级管理——版本检测、旧数据清理与升级通知。
- Export：`systemUpgrade(): Promise<void>`（字面）；内部 `VersionManager`（字面）
- 备注：认证相关（升级日志可配置强制重新登录）。

`src/utils/table/tableCache.ts`
- 职责（字面）：表格缓存管理——LRU 缓存与失效策略。
- Export：
  - `CacheInvalidationStrategy` — enum `CLEAR_ALL`/`CLEAR_CURRENT`/`CLEAR_PAGINATION`/`KEEP_ALL`（字面）
  - `ApiResponse<T>` — interface（字面）
  - `CacheItem<T>` — interface（字面）
  - `class TableCache<T>` — 方法 `set`/`get`/`clearByTags`/`clearCurrentSearch`/`clearPagination`/`clear`/`getStats`/`cleanupExpired`（字面）

`src/utils/table/tableConfig.ts`
- 职责（字面）：表格全局配置——与后端接口的字段映射配置。
- Export：`tableConfig` — 常量对象（recordFields/totalFields/currentFields/sizeFields/paginationKey 等）（字面）

`src/utils/table/tableUtils.ts`
- 职责（字面）：表格工具——响应适配、数据提取、防抖与错误处理。
- Export：
  - `BaseRequestParams` — interface extends `Api.Common.PaginationParams`（字面）
  - `TableError` — interface `{ code; message; details? }`（字面）
  - `defaultResponseAdapter<T>(response): ApiResponse<T>`、`extractTableData<T>(response): T[]`、`updatePaginationFromResponse<T>(pagination, response): void`、`createSmartDebounce<T>(fn, delay)`、`createErrorHandler(onError?, enableLog?)`（字面）

`src/utils/ui/index.ts`
- 职责（字面）：UI 工具统一导出。
- Export：`export * from './colors'`、`'./loading'`、`'./tabs'`、`'./emojo'`（字面；未含 animation/iconify-loader）

`src/utils/ui/animation.ts`
- 职责（字面）：主题动画工具——主题切换的圆形扩散过渡动画。
- Export：`themeAnimation(e: any)`、`toggleTransition(enable: boolean)`（字面）

`src/utils/ui/colors.ts`
- 职责（字面）：颜色处理工具——颜色转换与 Element Plus 主题色生成。
- Export：`getCssVar(name): string`、`hexToRgba`、`hexToRgb`、`rgbToHex`、`colourBlend`、`getLightColor`、`getDarkColor`、`handleElementThemeColor`、`setElementThemeColor`（字面）；内部 `RgbaResult` interface（字面）

`src/utils/ui/emojo.ts`
- 职责（字面）：表情常量（消息提示按状态码显示）。
- Export：`default` — `EmojiText: { [key: string]: string }`（键 '0'/'200'/'400'/'500'）（字面）

`src/utils/ui/iconify-loader.ts`
- 职责（字面）：离线图标加载器说明文件（内网预加载 Iconify 图标集；导入与 addCollection 均为注释，无有效导出）。
- Export：无（字面）

`src/utils/ui/loading.ts`
- 职责（字面）：全局 Loading 加载管理（全屏加载动画单例）。
- Export：`loadingService` — 全局 loading 对象，方法 `showLoading(): () => void` / `hideLoading(): void`（字面，`loading.ts:58-84`）

`src/utils/ui/tabs.ts`
- 职责（字面）：标签页布局配置（不同样式高度与间距）。
- Export：`TAB_CONFIG` — 常量对象含 `tab-default`/`tab-card`/`tab-google`（字面）；`getTabConfig(style: string)`（字面）
- 备注：布局相关。

`src/assets/svg/loading.ts`
- 职责（字面，源码内容）：SVG 加载图标字符串资源（四点旋转 spinner）。
- Export：`fourDotsSpinnerSvg: string` — SVG 字符串常量（字面，`loading.ts:2-32`；被 `utils/ui/loading.ts:31` 引用）

### 3.6 src/hooks

`src/hooks/index.ts`
- 职责（字面，源码逐条 export）：通用 hooks 统一导出入口（按功能分组 re-export，`hooks/index.ts:2-32`）。
- Export：`useCommon`/`useAppMode`/`useAuth`/`useTable`/`useTableColumns`/`useTheme`/`useCeremony`/`useFastEnter`/`useHeaderBar`/`useChart`/`useChartComponent`/`useChartOps`/`useLayoutHeight`/`useAutoLayoutHeight`（字面）

`src/hooks/core/useAppMode.ts`
- 职责（字面）：useAppMode - 应用模式管理（识别前端/后端权限控制模式）。
- Export：`useAppMode()`（字面）
- 备注：认证相关（依据 `VITE_ACCESS_MODE`）。

`src/hooks/core/useAuth.ts`
- 职责（字面）：useAuth - 权限验证管理（统一检查权限标识）。
- Export：`useAuth()`（字面）；内部 `AuthItem` type（字面）
- 备注：认证相关（前端模式取用户信息按钮权限，后端模式取路由 `meta.authList`）。

`src/hooks/core/useCeremony.ts`
- 职责（字面）：useCeremony - 节日庆祝管理（播放烟花与祝福文本）。
- Export：`useCeremony()`（字面）；`FESTIVAL_CONFIG` 常量（字面）

`src/hooks/core/useChart.ts`
- 职责（字面）：useChart - ECharts 图表管理（生命周期、主题与响应式）。
- Export：`useChartOps(): ChartThemeConfig`、`useChart(options: UseChartOptions = {})`、`useChartComponent<T extends BaseChartProps>(options)`（字面）；内部 `UseChartComponentOptions<T>` interface（字面）

`src/hooks/core/useCommon.ts`
- 职责（字面）：useCommon - 通用功能集合（首页路径、刷新与滚动控制）。
- Export：`useCommon()`（字面）
- 备注：路由相关（提供 `homePath`）。

`src/hooks/core/useFastEnter.ts`
- 职责（字面）：useFastEnter - 快速入口管理（应用列表与快速链接配置）。
- Export：`useFastEnter()`（字面）
- 备注：布局相关。

`src/hooks/core/useHeaderBar.ts`
- 职责（字面）：useHeaderBar - 顶部栏功能管理（控制模块显示状态）。
- Export：`useHeaderBar()`（字面）
- 备注：布局相关。

`src/hooks/core/useLayoutHeight.ts`
- 职责（字面）：useLayoutHeight - 页面布局高度管理。
- Export：`useLayoutHeight(options: LayoutHeightOptions = {})`、`useAutoLayoutHeight(headerIds?, options?)`（字面）；内部 `LayoutHeightOptions` interface（字面）
- 备注：布局相关。

`src/hooks/core/useTable.ts`
- 职责（字面）：useTable - 企业级表格数据管理（请求、分页、搜索、缓存与列配置）。
- Export：
  - `UseTableConfig<TApiFn, TRecord, TParams, TResponse>` — interface（字面）
  - `useTable<TApiFn>(config: UseTableConfig<TApiFn>)`（字面）
  - re-export：`CacheInvalidationStrategy`（值）、`ApiResponse`/`CacheItem`/`BaseRequestParams`/`TableError`（类型）（字面）

`src/hooks/core/useTableColumns.ts`
- 职责（字面）：useTableColumns - 表格列配置管理（显示/隐藏、排序、特殊列）。
- Export：`getColumnKey<T>`、`getColumnVisibility<T>`、`getColumnChecks<T>`（字面）；`DynamicColumnConfig<T>` interface（addColumn/removeColumn/toggleColumn/updateColumn/reorderColumns/getColumnConfig/getAllColumns/resetColumns，字面）；`useTableColumns<T>(columnsFactory)`（字面）

`src/hooks/core/useTableHeight.ts`
- 职责（字面）：useTableHeight - 表格高度自动计算。
- Export：`useTableHeight(options: TableHeightOptions)`（字面）；内部 `TableHeightOptions` interface、`TableHeightCalculator` class（字面）
- 备注：布局相关。

`src/hooks/core/useTheme.ts`
- 职责（字面）：useTheme - 系统主题管理（亮色/暗色/自动）。
- Export：`useTheme()`、`initializeTheme()`（字面）

### 3.7 src/directives

`src/directives/index.ts`
- 职责（字面，源码逐条 export）：全局指令统一安装入口（`setupGlobDirectives` 内依次调用 4 个 setup 函数，`directives/index.ts:7-14`）。
- Export：`setupGlobDirectives(app: App)`（字面）；re-export 类型 `AuthDirective`/`HighlightDirective`/`RippleDirective`/`RolesDirective`（字面）

`src/directives/core/auth.ts`
- 职责（字面）：v-auth 权限指令（按权限标识控制 DOM 显示/移除）。
- Export：`AuthDirective` — type `Directive<HTMLElement, string>`（字面）；`setupAuthDirective(app: App): void`（字面）
- 备注：认证相关（权限列表取当前路由 `meta.authList`）。

`src/directives/core/roles.ts`
- 职责（字面）：v-roles 角色权限指令（按用户角色控制 DOM）。
- Export：`RolesDirective` — type `Directive<HTMLElement, string | string[]>`（字面）；`setupRolesDirective(app: App): void`（字面）
- 备注：认证相关（角色取 `userStore.getUserInfo.roles`）。

`src/directives/business/highlight.ts`
- 职责（字面）：v-highlight 代码高亮指令（语法高亮、行号、复制按钮）。
- Export：`HighlightDirective` — type `Directive<HTMLElement>`（字面）；`setupHighlightDirective(app: App)`（字面）

`src/directives/business/ripple.ts`
- 职责（字面）：v-ripple 水波纹效果指令。
- Export：`RippleOptions` — interface `{ color? }`（字面）；`RippleDirective` — type `Directive<HTMLElement, RippleOptions>`（字面）；`vRipple`；`setupRippleDirective(app: App)`（字面）

### 3.8 src/types

`src/types/index.ts`
- 职责（字面）：类型定义统一导出入口。
- Export：`export * from './common'`、`'./component'`、`'./store'`、`'./router'`、`'./config'`（字面）

`src/types/api/api.d.ts`
- 职责（字面）：后端接口类型定义，全局命名空间 `Api`（通用/认证/系统管理三类）。
- Export：`Api.Common.PaginationParams`/`CommonSearchParams`/`PaginatedResponse<T>`/`EnableStatus`；`Api.Auth.LoginParams`/`LoginResponse`/`UserInfo`；`Api.SystemManage.UserList`/`UserListItem`/`UserSearchParams`/`RoleList`/`RoleListItem`/`RoleSearchParams`（字面）
- 备注：`Api.Auth` 集中定义登录与用户信息类型。

`src/types/common/index.ts`
- 职责（字面）：通用基础类型与工具类型定义，统一转出 response。
- Export：`Status`/`Gender`/`SortOrder`/`ActionType`/`Breakpoint`/`ThemeMode`/`Language`/`Environment`/`DialogType` 等 type；`Recordable<T>`/`KeyValue<T>`/`TimeRange`/`FileInfo`/`Position`/`Size` 等 interface；`export * from './response'`（字面）

`src/types/common/response.ts`
- 职责（字面）：统一 API 响应结构类型。
- Export：`BaseResponse<T>` — interface `{ code; msg; data }`（字面）

`src/types/component/chart.ts`
- 职责（字面）：ECharts 图表组件类型集合（配置、Props、数据项、事件回调）。
- Export：`LegendPosition`/`SymbolType`/`ChartOptionGenerator`/`ChartEventCallback` 等 type；`ChartThemeConfig`/`UseChartOptions`/`BaseChartProps`/`AxisDisplayProps`/`InteractionProps` 等 interface；`BarDataItem`/`BarChartProps`/`LineDataItem`/`LineChartProps`/`RadarChartProps`/`RingChartProps`/`KLineChartProps`/`ScatterChartProps`/`DualBarCompareChartProps`/`MapChartProps`/`BidirectionalBarChartProps`/`ChartError`（字面）

`src/types/component/index.ts`
- 职责（字面）：通用业务组件类型（搜索、表格列、分页、表单规则、对话框）。
- Export：`SearchComponentType`（type）；`SearchChangeParams`/`ColumnOption<T>`/`PaginationConfig`/`FormRule`/`DialogConfig`（interface）（字面）

`src/types/config/index.ts`
- 职责（字面）：系统配置相关类型（主题、布局、节日、系统信息、快速入口、顶部栏、环境）。
- Export：`ThemeSetting`/`MenuLayout`/`FestivalConfig`/`SystemBasicConfig`/`FastEnterBaseItem`/`FastEnterApplication`/`FastEnterQuickLink`/`FastEnterConfig`/`SystemConfig`/`EnvConfig`/`AppConfig`/`FeatureConfigItem`/`HeaderBarFeatureConfig`（字面）
- 备注：`MenuLayout` 定义菜单布局项、`HeaderBarFeatureConfig` 定义顶部栏功能开关。

`src/types/directive/directive.d.ts`
- 职责（字面）：为 vue 模块补充全局指令类型声明。
- Export：`GlobalDirectives`（module augmentation）— `{ vAuth; vRoles; vRipple; vHighlight }`（字面）
- 备注：vAuth/vRoles 为权限角色相关。

`src/types/import/auto-imports.d.ts`
- 职责（字面）：unplugin-auto-import 自动生成的全局 API 声明（Generated/@ts-nocheck）。
- Export：`export {}`；`declare global` 大量 vue/vueuse/pinia/vue-router/element-plus 的 const 与 type（自动生成，未逐条展开）（字面）

`src/types/router/index.ts`
- 职责（字面）：路由元数据类型与应用路由记录类型。
- Export：
  - `RouteMeta` — interface extends Record，含 `title`/`icon`/`showBadge`/`isHide`/`isHideTab`/`link`/`isIframe`/`keepAlive`/`authList`/`roles`/`fixedTab`/`activePath`/`isFullPage`/`authMark`/`parentPath` 等（字面）
  - `AppRouteRecord` — interface extends Omit<RouteRecordRaw, 'meta'|'children'|'component'>（字面）
- 备注：字段涵盖菜单生成、权限控制、标签页。

`src/types/store/index.ts`
- 职责（字面）：Pinia Store 各模块状态类型定义。
- Export：`SystemThemeType`/`MenuThemeType`/`SettingState`/`WorkTab`/`UserState`/`SettingStoreState`/`WorkTabState`/`MenuState`/`RootState`（interface）；`SystemThemeTypes` type（字面）
- 备注：UserState（认证）、MenuState/WorkTabState（菜单与标签页）。

### 3.9 src/enums

`src/enums/appEnum.ts`
- 职责（字面）：系统级枚举（菜单类型、主题、菜单主题、菜单宽度、语言、容器宽度）。
- Export：`MenuTypeEnum {LEFT,TOP,TOP_LEFT,DUAL_MENU}`、`SystemThemeEnum {DARK,LIGHT,AUTO}`、`MenuThemeEnum {DARK,LIGHT,DESIGN}`、`MenuWidth {CLOSE='64px'}`、`LanguageEnum {ZH='zh',EN='en'}`、`ContainerWidthEnum {FULL='100%',BOXED='1200px'}`（字面）
- 备注：菜单类型与容器宽度枚举。

`src/enums/formEnum.ts`
- 职责（字面）：表单相关枚举（页面模式、表格尺寸）。
- Export：`PageModeEnum {Add,Edit}`（数字枚举）、`TableSizeEnum {DEFAULT,SMALL,LARGE}`（字面）

### 3.10 src/plugins

`src/plugins/echarts.ts`
- 职责（字面）：ECharts 按需导入与组件注册。
- Export：`echarts` — echarts/core 实例（已 use 图表/组件/CanvasRenderer）；`EChartsOption`/`BarSeriesOption` type 重导出；`graphic`（字面）

`src/plugins/index.ts`
- 职责（字面）：插件统一导出入口。
- Export：`export * from './echarts'`（字面）

### 3.11 src/locales

`src/locales/index.ts`
- 职责（字面）：基于 vue-i18n 的国际化配置（语言选项与全局翻译函数）。
- Export：`languageOptions` — `[{value,label}]`（简体中文/English）（字面）；`$t` — `(key: string) => string`（字面）；`default i18n` — I18n 实例（locale 取本地存储，legacy:false，globalInjection:true）（字面）

`src/locales/langs/zh.json`
- 职责（字面，源码内容）：简体中文语言包。
- Export：无 ES 导出；顶层命名空间 `httpMsg`/`topBar`/`common`/`search`/`setting`/`notice`/`worktab`/`login`/`forgetPassword`/`register`/`lockScreen`/`greeting`/`exceptionPage`/`menus`/`table`（字面，逐条核对顶层键）
- 备注：`menus` 为静态菜单标题来源（内容见 4.3 节）。

`src/locales/langs/en.json`
- 职责（字面，源码内容）：英文语言包，键结构与 zh.json 一致。
- Export：无 ES 导出；顶层命名空间与 zh.json 相同（字面，逐条核对顶层键）

### 3.12 src/mock

`src/mock/json/chinaMap.json`
- 职责（字面，源码内容）：中国地图 GeoJSON 数据。
- Export：无 ES 导出；结构 `{ type: 'FeatureCollection', features }`，features 34 项（字面，逐项核对）

`src/mock/temp/articleList.ts`
- 职责（字面，源码内容）：文章列表 mock 数据。
- Export：`ArticleList` — 常量数组（元素含 id/blog_class/title/count/create_time/home_img/brief/type_name/html_content）（字面）

`src/mock/temp/commentDetail.ts`
- 职责（字面，源码内容）：评论详情 mock 数据（含嵌套回复）。
- Export：`Comment` — interface `{ id; author; content; timestamp; replies: Comment[] }`（字面）；`commentList` — `ref<Comment[]>` 3 条（字面，顶层元素逐项核对）

`src/mock/temp/commentList.ts`
- 职责（字面，源码内容）：评论列表 mock 数据。
- Export：`commentList` — reactive 数组，30 条 `{ id; date; content; collection; comment; userName }`（字面）

`src/mock/temp/formData.ts`
- 职责（字面，源码内容）：表单/表格 mock 数据（用户与角色列表）。
- Export：`User` interface；`ACCOUNT_TABLE_DATA: User[]`（15 条）；`Role` interface；`ROLE_LIST_DATA: Role[]`（10 条）（字面）

`src/mock/upgrade/changeLog.ts`
- 职责（字面）：系统升级日志 mock 数据。
- Export：`upgradeLogList` — `ref<UpgradeLog[]>`，自 v3.0.2 起多版本记录（字面）；内部 `UpgradeLog` interface `{ version; title; date; detail?; requireReLogin?; remark? }`（字面）

### 3.13 src/components/core — layouts（布局/菜单/认证）

`src/components/core/layouts/art-breadcrumb/index.vue`
- 职责（字面）：面包屑导航。
- Export：`default`（name ArtBreadcrumb）；`interface BreadcrumbItem` — `{ path: string; meta: RouteRecordRaw['meta'] }`（字面）
- 备注：基于 `route.matched` 生成，与路由相关。

`src/components/core/layouts/art-chat-window/index.vue`
- 职责（字面）：系统聊天窗口。
- Export：`default`（name ArtChatWindow）；`interface ChatMessage`；常量 `MOBILE_BREAKPOINT = 640`（字面）

`src/components/core/layouts/art-fast-enter/index.vue`
- 职责（字面）：顶部快速入口面板。
- Export：`default`（name ArtFastEnter）；无 Props/Emits（仅 slot）（字面）

`src/components/core/layouts/art-fireworks-effect/index.vue`
- 职责（字面）：烟花/礼花效果。
- Export：`default`（name ArtFireworksEffect）；`interface FireworkConfig`（含 POOL_SIZE/PARTICLES_PER_BURST/SIZES，字面）

`src/components/core/layouts/art-global-component/index.vue`
- 职责（字面）：全局组件（挂载全局组件配置的组件）。
- Export：`default`（name ArtGlobalComponent）（字面）

`src/components/core/layouts/art-global-search/index.vue`
- 职责（字面）：全局搜索组件。
- Export：`default`（name ArtGlobalSearch）；常量 `historyMaxLength = 10`（字面）
- 备注：搜索菜单项并通过 `handleMenuJump` 跳转，与菜单/路由相关。

`src/components/core/layouts/art-header-bar/index.vue`
- 职责（字面）：顶部栏。
- Export：`default`（name ArtHeaderBar）（字面）
- 备注：集成 Logo、菜单按钮、水平/混合菜单、面包屑、用户菜单、通知、标签页，与布局/菜单相关。

`src/components/core/layouts/art-header-bar/widget/ArtUserMenu.vue`
- 职责（字面）：用户菜单。
- Export：`default`（name ArtUserMenu）（字面）
- 备注：含个人中心、锁屏、退出登录，与认证相关。

`src/components/core/layouts/art-menus/art-horizontal-menu/index.vue`
- 职责（字面）：水平菜单。
- Export：`default`（name ArtHorizontalMenu）；Props `{ list: AppRouteRecord[] }`（字面）
- 备注：菜单组件。

`src/components/core/layouts/art-menus/art-horizontal-menu/widget/HorizontalSubmenu.vue`
- 职责（字面，模板组件）：水平菜单的递归子菜单项组件（`ElSubMenu` + `ArtSvgIcon` + `formatMenuTitle`，模板首行）。
- Export：`default`；Props `{ item; theme?; isMobile?; level? }`；Emits `close`（字面）
- 备注：菜单组件。

`src/components/core/layouts/art-menus/art-mixed-menu/index.vue`
- 职责（字面）：混合菜单。
- Export：`default`（name ArtMixedMenu）；`interface Props`；`interface ProcessedMenuItem`；`type ScrollDirection = 'left'|'right'`；常量 `SCROLL_CONFIG`（字面）
- 备注：菜单组件。

`src/components/core/layouts/art-menus/art-sidebar-menu/index.vue`
- 职责（字面）：左侧菜单或双列菜单。
- Export：`default`（name ArtSidebarMenu）；常量 `MOBILE_BREAKPOINT`/`ANIMATION_DELAY`/`MENU_CLOSE_WIDTH`（字面）
- 备注：菜单组件。

`src/components/core/layouts/art-menus/art-sidebar-menu/widget/SidebarSubmenu.vue`
- 职责（字面，模板组件）：侧边栏菜单的递归子菜单项组件（`ElSubMenu` + `filteredMenuItems` + `hasChildren`，模板首行）。
- Export：`default`；`interface MenuTheme`；`interface Props`；`interface Emits`（字面）
- 备注：菜单组件。

`src/components/core/layouts/art-notification/index.vue`
- 职责（字面）：通知组件。
- Export：`default`（name ArtNotification）；`NoticeItem`/`MessageItem`/`PendingItem`/`BarItem`/`NoticeStyle` interface；`type NoticeType = 'email'|'message'|'collection'|'user'|'notice'`；Props `{ value: boolean }`；Emits `update:value`（字面）

`src/components/core/layouts/art-page-content/index.vue`
- 职责（字面）：布局内容。
- Export：`default`（name ArtPageContent）（字面）
- 备注：承载 RouterView/KeepAlive/Transition，按 `route.meta.isFullPage` 切换无基础布局模式，与路由/布局相关。

`src/components/core/layouts/art-screen-lock/index.vue`
- 职责（字面）：锁屏。
- Export：`default` — 已读完整 `<script setup>`，无显式 `defineOptions`，name 由文件名推断为 `ArtScreenLock`（非源码字面）；常量 `ENCRYPT_KEY = import.meta.env.VITE_LOCK_ENCRYPT_KEY`（字面，`index.vue:120`）
- 备注：锁屏/解锁与返回登录，基于 userStore 的 lockPassword/isLock，与认证相关。

`src/components/core/layouts/art-settings-panel/index.vue`
- 职责（字面）：设置面板。
- Export：`default`（name ArtSettingsPanel）；`interface Props` — `{ open?: boolean }`（字面）

`src/components/core/layouts/art-settings-panel/composables/useSettingsConfig.ts`
- 职责（字面）：设置项配置选项管理。
- Export：`useSettingsConfig()` — 返回 tabStyleOptions/pageTransitionOptions/.../basicSettingsConfig（字面）

`src/components/core/layouts/art-settings-panel/composables/useSettingsHandlers.ts`
- 职责（字面）：设置项通用处理逻辑。
- Export：`useSettingsHandlers()` — 返回 domOperations/basicHandlers/boxStyleHandlers/...（字面）

`src/components/core/layouts/art-settings-panel/composables/useSettingsPanel.ts`
- 职责（字面）：设置面板核心逻辑管理。
- Export：`useSettingsPanel()` — 返回 showDrawer/useThemeHandlers/useResponsiveLayout/...（字面）
- 备注：含响应式菜单类型切换（RESPONSIVE_MENU_TYPE_KEY），与布局/菜单相关。

`src/components/core/layouts/art-settings-panel/composables/useSettingsState.ts`
- 职责（字面）：设置状态管理。
- Export：`useSettingsState()` — 返回 `initColorWeak`/`switchMenuLayouts`（字面）
- 备注：switchMenuLayouts 切换菜单布局，与菜单相关。

`src/components/core/layouts/art-settings-panel/widget/SectionTitle.vue`
- 职责（字面，模板）：设置分组标题（居中 `<p>` + 两侧横线样式）。
- Export：`default`；`interface Props` — `{ title: string; style? }`（字面）

`src/components/core/layouts/art-settings-panel/widget/SettingHeader.vue`
- 职责（字面，模板）：设置抽屉头部关闭按钮（`@click="$emit('close')"`，模板首行）。
- Export：`default`；Emits `close`（字面）

`src/components/core/layouts/art-settings-panel/widget/ContainerSettings.vue`
- 职责（字面，模板）：容器宽度设置项（`SectionTitle :title="$t('setting.container.title')"`，模板首行）。
- Export：`default`；无 Props/Emits（字面）
- 备注：与布局（容器宽度）相关。

`src/components/core/layouts/art-settings-panel/widget/BoxStyleSettings.vue`
- 职责（字面，模板）：盒子样式（边框/阴影模式）设置项（`SectionTitle :title="$t('setting.box.title')"`，模板首行）。
- Export：`default`；无 Props/Emits（字面）

`src/components/core/layouts/art-settings-panel/widget/ColorSettings.vue`
- 职责（字面，模板）：系统主题色设置项（`SectionTitle :title="$t('setting.color.title')"`，模板首行）。
- Export：`default`；无 Props/Emits（字面）

`src/components/core/layouts/art-settings-panel/widget/MenuLayoutSettings.vue`
- 职责（字面，模板）：菜单布局设置项（`SectionTitle :title="$t('setting.menuType.title')"`，模板首行）。
- Export：`default`（字面）
- 备注：与菜单相关。

`src/components/core/layouts/art-settings-panel/widget/MenuStyleSettings.vue`
- 职责（字面，模板）：菜单风格设置项（`SectionTitle :title="$t('setting.menu.title')"`，模板首行）。
- Export：`default`（字面）
- 备注：与菜单相关。

`src/components/core/layouts/art-settings-panel/widget/BasicSettings.vue`
- 职责（字面，模板）：基础配置项设置列表（`SectionTitle` + `v-for config in basicSettingsConfig` 的 `SettingItem`，模板首行）。
- Export：`default`（字面）
- 备注：含菜单/工作区/水印等开关，部分与布局/菜单相关。

`src/components/core/layouts/art-settings-panel/widget/SettingActions.vue`
- 职责（字面）：设置操作按钮（复制/重置配置）。
- Export：`default`（name SettingActions）；`interface ConfigItem`；常量 `ENUM_MAPS`/`CONFIG_ITEMS`（字面）

`src/components/core/layouts/art-settings-panel/widget/SettingDrawer.vue`
- 职责（字面，模板）：设置抽屉容器（封装 `ElDrawer size="300px"`，模板首行）。
- Export：`default`；`interface Props` — `{ modelValue: boolean }`；`interface Emits` — update:modelValue/open/close（字面）

`src/components/core/layouts/art-settings-panel/widget/SettingItem.vue`
- 职责（字面，模板）：通用设置项渲染器（`ElSwitch` 等按 `config.type` 分支渲染，模板首行）。
- Export：`default`；`interface SettingItemConfig`；`interface Props`；`interface Emits`（字面）

`src/components/core/layouts/art-settings-panel/widget/ThemeSettings.vue`
- 职责（字面，模板）：主题风格设置项（`SectionTitle :title="$t('setting.theme.title')"`，模板首行）。
- Export：`default`（字面）

`src/components/core/layouts/art-work-tab/index.vue`
- 职责（字面）：标签页。
- Export：`default`（name ArtWorkTab）；`interface ScrollState`/`TouchState`；`type TabCloseType = 'current'|'left'|'right'|'other'|'all'`（字面）
- 备注：基于 worktab store 与路由展示/跳转，与路由/布局相关。

### 3.14 src/components/core — banners / base / cards / charts / forms

`src/components/core/banners/art-basic-banner/index.vue`
- 职责（字面）：基础横幅组件（标题/副标题/按钮/背景图/流星装饰）。
- Export：`default`（name ArtBasicBanner）；Props `height`/`title`/`subtitle`/`boxStyle`/`decoration`/`buttonConfig`/`meteorConfig`/`imageConfig`/`titleColor`/`subtitleColor`；Emits `click`/`buttonClick`（字面）

`src/components/core/banners/art-card-banner/index.vue`
- 职责（字面）：卡片横幅组件（图片+标题+描述+按钮/取消按钮）。
- Export：`default`（name ArtCardBanner）；Props `CardBannerProps`；Emits `click`/`cancel`（字面）

`src/components/core/base/art-back-to-top/index.vue`
- 职责（字面）：返回顶部按钮。
- Export：`default`（name ArtBackToTop）（字面）

`src/components/core/base/art-logo/index.vue`
- 职责（字面）：系统 logo。
- Export：`default`（name ArtLogo）；Props `size?: number | string`（默认 36）（字面）

`src/components/core/base/art-svg-icon/index.vue`
- 职责（字面）：图标组件（基于 @iconify/vue 的 Icon 封装）。
- Export：`default`（name ArtSvgIcon, inheritAttrs:false）；Props `icon?: string`（字面）

`src/components/core/cards/art-bar-chart-card/index.vue`
- 职责（字面）：柱状图卡片（数值/标签/百分比/柱状图，支持迷你模式）。
- Export：`default`（name ArtBarChartCard）；Props `value`/`label`/`percentage`/`date`/`height`/`color`/`chartData`/`barWidth`/`isMiniChart`（字面）

`src/components/core/cards/art-data-list-card/index.vue`
- 职责（字面）：数据列表卡片。
- Export：`default`（name ArtDataListCard）；Props `list: Activity[]`/`title`/`subtitle`/`maxCount`/`showMoreButton`；`interface Activity`；Emits `more`（字面）

`src/components/core/cards/art-donut-chart-card/index.vue`
- 职责（字面）：环型图卡片（数值/百分比/对比值/环形图）。
- Export：`default`（name ArtDonutChartCard）；Props `value`/`title`/`percentage`/`percentageLabel`/`currentValue`/`previousValue`/`height`/`color`/`radius`/`data`（字面）

`src/components/core/cards/art-image-card/index.vue`
- 职责（字面）：图片卡片。
- Export：`default`（name ArtImageCard）；Props `imageUrl`/`title`/`category`/`readTime`/`views`/`comments`/`date`；Emits `click(card: Props)`（字面）

`src/components/core/cards/art-line-chart-card/index.vue`
- 职责（字面）：折线图卡片（支持迷你模式）。
- Export：`default`（name ArtLineChartCard）；Props `value`/`label`/`percentage`/`date`/`height`/`color`/`showAreaColor`/`chartData`/`isMiniChart`（字面）

`src/components/core/cards/art-progress-card/index.vue`
- 职责（字面）：进度条卡片（带进入/变化动画）。
- Export：`default`（name ArtProgressCard）；Props `percentage`/`title`/`color`/`icon`/`iconStyle`/`strokeWidth`（字面）

`src/components/core/cards/art-stats-card/index.vue`
- 职责（字面）：统计卡片（图标+标题+计数+描述）。
- Export：`default`（name ArtStatsCard）；`StatsCardProps` interface（boxStyle/icon/iconStyle/title/count/decimals/separator/description/textColor/showArrow）（字面）

`src/components/core/cards/art-timeline-list-card/index.vue`
- 职责（字面）：时间轴列表卡片。
- Export：`default`（name ArtTimelineListCard）；`TimelineItem` interface；Props `list`/`title`/`subtitle`/`maxCount`（字面）

`src/components/core/charts/art-bar-chart/index.vue`
- 职责（字面）：柱状图（ECharts，支持单/多数据与堆叠）。
- Export：`default`（name ArtBarChart）；Props `BarChartProps`（定义于 `@/types/component/chart`，此处仅 withDefaults 默认值）（字面）

`src/components/core/charts/art-dual-bar-compare-chart/index.vue`
- 职责（字面）：双向堆叠柱状图（正负数据对比）。
- Export：`default`（name ArtDualBarCompareChart）；Props `BidirectionalBarChartProps`（定义于 `@/types/component/chart`）（字面）

`src/components/core/charts/art-h-bar-chart/index.vue`
- 职责（字面）：水平柱状图。
- Export：`default`（name ArtHBarChart）；Props `BarChartProps`（字面）

`src/components/core/charts/art-k-line-chart/index.vue`
- 职责（字面）：K 线图（ECharts，支持 dataZoom）。
- Export：`default`（name ArtKLineChart）；Props `KLineChartProps`（字面）

`src/components/core/charts/art-line-chart/index.vue`
- 职责（字面）：折线图（支持多组数据、阶梯式动画）。
- Export：`default`（name ArtLineChart）；Props `LineChartProps`（字面）

`src/components/core/charts/art-map-chart/index.vue`
- 职责（字面）：中国地图图表（ECharts，支持区域点击与空态）。
- Export：`default`（name ArtMapChart）；Props `MapChartProps`；Emits `renderComplete`/`regionClick(region)`（字面）

`src/components/core/charts/art-radar-chart/index.vue`
- 职责（字面）：雷达图（含明暗主题样式）。
- Export：`default`（name ArtRadarChart）；Props `RadarChartProps`（字面）

`src/components/core/charts/art-ring-chart/index.vue`
- 职责（字面）：环形图（支持中心文字与图例位置）。
- Export：`default`（name ArtRingChart）；Props `RingChartProps`（字面）

`src/components/core/charts/art-scatter-chart/index.vue`
- 职责（字面）：散点图（含明暗主题样式）。
- Export：`default`（name ArtScatterChart）；Props `ScatterChartProps`（字面）

`src/components/core/forms/art-button-more/index.vue`
- 职责（字面）：更多按钮（带权限过滤的下拉更多操作菜单）。
- Export：`default`（name ArtButtonMore）；`ButtonMoreItem` export interface；Props `list`/`auth`；Emits `click(item)`（字面）
- 备注：使用 `useAuth().hasAuth` 与 `item.auth` 过滤菜单项，与认证/菜单相关。

`src/components/core/forms/art-button-table/index.vue`
- 职责（字面）：表格按钮（按 type 映射默认图标/样式）。
- Export：`default`（name ArtButtonTable）；Props `type?: 'add'|'edit'|'delete'|'more'|'view'`/`icon`/`iconClass`/`iconColor`/`buttonBgColor`；Emits `click`（字面）

`src/components/core/forms/art-drag-verify/index.vue`
- 职责（字面）：拖拽验证组件（滑块拖拽完成验证）。
- Export：`default`（name ArtDragVerify）；Props `value`/`width`/`height`/`text`/`successText` 等；Emits `handlerMove`/`update:value`/`passCallback`；Expose `reset()`（字面）

`src/components/core/forms/art-excel-export/index.vue`
- 职责（字面）：导出 Excel 文件（基于 xlsx/file-saver）。
- Export：`default`（name ArtExcelExport）；`ExportValue` type；`ExportData`/`ColumnConfig`/`ExportOptions` interface；Emits `before-export`/`export-success`/`export-error`/`export-progress`；Expose `exportData`/`isExporting`/`hasData`（字面）

`src/components/core/forms/art-excel-import/index.vue`
- 职责（字面）：导入 Excel 文件（ElUpload 选择 .xlsx/.xls 并解析为 JSON）。
- Export：`default`（name ArtExcelImport）；Emits `import-success(data)`/`import-error(error)`（字面）

`src/components/core/forms/art-form/index.vue`
- 职责（字面）：表单组件（基于配置的动态表单，支持控件/自定义组件/插槽/校验/隐藏项）。
- Export：`default`（name ArtForm）；`FormItem` export interface；`FormProps`/`SanitizeOutputOptions`/`FormEmits` interface；`defineModel('modelValue')`；Expose `ref`/`validate`/`reset`/`getOutput`（字面）

`src/components/core/forms/art-search-bar/index.vue`
- 职责（字面）：表格搜索组件（基于配置的动态搜索表单，支持展开/收起与空值清洗）。
- Export：`default`（name ArtSearchBar）；`SearchFormItem` export interface；`SearchBarProps`/`SanitizeOutputOptions`/`SearchBarEmits` interface；`defineModel('modelValue')`；Expose `ref`/`validate`/`reset`/`getOutput`（字面）

`src/components/core/forms/art-wang-editor/index.vue`
- 职责（字面）：WangEditor 富文本编辑器（封装 Editor/Toolbar，支持图片上传）。
- Export：`default`（name ArtWangEditor）；Props `height`/`toolbarKeys?`/`insertKeys?`/`excludeKeys?`/`mode`/`placeholder`/`uploadConfig?`；`defineModel('modelValue'): string`；Expose `getEditor`/`setHtml`/`getHtml`/`clear`/`focus`（字面）
- 备注：上传 headers 使用 userStore.accessToken（Authorization），与认证相关。

### 3.15 src/components/core — media / others / tables / text-effect / theme / views / widget

`src/components/core/media/art-cutter-img/index.vue`
- 职责（字面）：图片裁剪组件（基于 vue-img-cutter 的 ImgCutter，支持预览与下载）。
- Export：`default`（name ArtCutterImg）；Props `isModal`/`tool`/`boxWidth`/`cutWidth`/`imgUrl` 等；Emits `update:imgUrl`/`error`/`imageLoadComplete`/`imageLoadError`（字面）

`src/components/core/media/art-video-player/index.vue`
- 职责（字面）：视频播放器组件（基于 xgplayer）。
- Export：`default`（name ArtVideoPlayer）；Props `playerId`/`videoUrl`/`posterUrl`/`autoplay?`/`volume?` 等（字面）

`src/components/core/others/art-menu-right/index.vue`
- 职责（字面）：右键菜单。
- Export：`default`（name ArtMenuRight）；`MenuItemType` export interface；`interface Props`；Emits `select`/`show`/`hide`；Expose `show`/`hide`/`visible`（字面）

`src/components/core/others/art-watermark/index.vue`
- 职责（字面）：水印组件。
- Export：`default`（name ArtWatermark）；`interface WatermarkProps` — `{ content?; visible?; fontSize?; fontColor?; rotate?; gapX?; gapY?; offsetX?; offsetY?; zIndex? }`（字面）

`src/components/core/tables/art-table/index.vue`
- 职责（字面）：表格组件（支持 el-table 属性/事件/插槽，扩展分页、自定义列、loading、边框、斑马纹、尺寸、表头背景）。
- Export：`default`（name ArtTable）；`PaginationConfig`/`PaginationOptions`/`ArtTableProps` interface；Emits `pagination:size-change`/`pagination:current-change`；Expose `scrollToTop`/`elTableRef`（字面）

`src/components/core/tables/art-table-header/index.vue`
- 职责（字面）：表格头部（表格大小、刷新、全屏、列设置、其他设置）。
- Export：`default`（name ArtTableHeader）；`interface Props`；`defineModel('columns')`；Emits `refresh`/`search`/`update:showSearchBar`（字面）

`src/components/core/text-effect/art-count-to/index.vue`
- 职责（字面）：数字滚动。
- Export：`default`；`CountToProps`/`CountToEmits`/`CountToExpose` interface；常量 `EPSILON`/`MIN_DURATION`/`MAX_DURATION`/`MAX_DECIMALS`/`DEFAULT_EASING`/`DEFAULT_DURATION`（字面）

`src/components/core/text-effect/art-festival-text-scroll/index.vue`
- 职责（字面）：节日文本滚动。
- Export：`default`（name ArtFestivalTextScroll）；无 Props/Emits（字面）

`src/components/core/text-effect/art-text-scroll/index.vue`
- 职责（字面）：文字滚动。
- Export：`default`；`type ThemeType`；`TextScrollProps` export interface；Emits `close`（字面）

`src/components/core/theme/theme-svg/index.vue`
- 职责（字面）：让 SVG 图片跟随主题的组件（仅对特定 SVG 生效，不建议开发者使用）。
- Export：`default` — 已读完整 `<script setup>`，无显式 `defineOptions`，name 由文件名推断为 `ThemeSvg`（非源码字面）；`interface Props`；常量 `COLOR_MAPPINGS`（字面）

`src/components/core/views/exception/ArtException.vue`
- 职责（字面，模板）：异常页面（`data.imgUrl`/`data.desc`/`data.btnText` + `backHome`，模板首行）。
- Export：`default`；`interface ExceptionData`；Props `{ data: ExceptionData }`（字面）
- 备注：未登录跳 `Login` 路由并带 redirect，与认证/路由相关。

`src/components/core/views/login/AuthTopBar.vue`
- 职责（字面）：授权页右上角组件。
- Export：`default`（name AuthTopBar）（字面）
- 备注：授权页主题色/语言/主题切换，与认证相关。

`src/components/core/views/login/LoginLeftView.vue`
- 职责（字面）：登录、注册、忘记密码左侧背景。
- Export：`default`；Props `{ hideContent?: boolean }`（字面）
- 备注：认证相关页面。

`src/components/core/views/result/ArtResultPage.vue`
- 职责（字面，模板）：结果页（成功/失败，按 `type` 切换图标色，模板首行）。
- Export：`default`（name ArtResultPage）；`interface ResultPageProps` — `{ type: 'success'|'fail'; title; message; iconCode }`（字面）

`src/components/core/widget/art-icon-button/index.vue`
- 职责（字面）：按钮组件。
- Export：`default`（name ArtIconButton）；`interface Props` — `{ icon: string; circle?: boolean }`（字面）

### 3.16 src/components/business

`src/components/business/comment-widget/index.vue`
- 职责（字面，模板）：评论发布与评论列表展示组件（`ElForm @submit.prevent="addComment"` + CommentItem 列表，模板首行）。
- Export：`default`；无 defineProps/defineEmits/defineExpose（字面）

`src/components/business/comment-widget/widget/CommentItem.vue`
- 职责（字面，模板）：单条评论项组件，含回复表单与递归子回复（`randomColor()` + 回复表单，模板首行）。
- Export：`default`；`interface Comment` — `{ id; author; content; timestamp; replies: Comment[] }`；Props `{ comment; showReplyForm }`；Emits `toggle-reply`/`add-reply`（字面）

### 3.17 src/views — article / auth / change / dashboard / exception / index / outside / result / safeguard

`src/views/index/index.vue`
- 职责（字面）：应用布局容器（组合侧边菜单、头部栏、页面内容、全局组件）。
- Export：`default`（name AppLayout）（字面）
- 备注：布局/菜单相关；template 使用 ArtSidebarMenu/ArtHeaderBar/ArtPageContent/ArtGlobalComponent。

`src/views/article/comment/index.vue`
- 职责（字面）：留言墙页面（顶部注释「留言管理页面」）。
- Export：`default`（name ArticleComment）（字面）

`src/views/article/detail/index.vue`
- 职责（字面）：文章详情页（按路由 id 加载文章标题与 HTML）。
- Export：`default`（name ArticleDetail）；`interface ArticleResponse` — `{ code; data: { title; html_content } }`（字面）
- 备注：读取 `route.params.id`。

`src/views/article/list/index.vue`
- 职责（字面）：文章列表页（标题搜索、年份筛选、分页、新增/编辑/详情跳转）。
- Export：`default`（name ArticleList）；`interface Article`；`interface GetArticleListOptions`；常量 `YEAR_OPTIONS`/`PAGE_SIZE`（字面）
- 备注：`v-auth="'add'"`/`'edit'` 权限指令。

`src/views/article/publish/index.vue`
- 职责（字面）：文章发布页（标题/类型、富文本、封面上传、发布设置，区分新增/编辑）。
- Export：`default`（name ArticlePublish）；`ArticleType`/`UploadResponse`/`ArticleDetailResponse` interface；常量 `MAX_IMAGE_SIZE`/`EMPTY_EDITOR_CONTENT`（字面）
- 备注：使用 `useUserStore().accessToken` 组 Authorization；按 `route.query.id` 判断 PageModeEnum。

`src/views/auth/login/index.vue`
- 职责（字面）：登录页（账号选择、表单校验、滑块验证、登录请求与跳转）。
- Export：`default`（name Login）；`Account` export interface；`AccountKey` type `'super'|'admin'|'user'`（字面）
- 备注：认证核心（字面，`login/index.vue:222-241`）；`fetchLogin` 返回 `LoginResponse { token, refreshToken }`（见 `api.d.ts:71-75`），解构后调用 `userStore.setToken(token, refreshToken)`（内部写入 state `accessToken`/`refreshToken`，见 `user.ts:131-136`）与 `userStore.setLoginStatus(true)`；读 `route.query.redirect`。

`src/views/auth/register/index.vue`
- 职责（字面）：注册页（用户名/密码/确认密码/协议校验与模拟注册）。
- Export：`default`（name Register）（字面）
- 内部声明（非 export，字面 `register/index.vue:94-104`）：`interface RegisterForm`；常量 `USERNAME_MIN_LENGTH`/`USERNAME_MAX_LENGTH`/`PASSWORD_MIN_LENGTH`/`REDIRECT_DELAY`
- 备注：认证页面；RouterLink 到 Login 与 `/privacy-policy`。

`src/views/auth/forget-password/index.vue`
- 职责（字面，模板）：找回密码页（`LoginLeftView` + `AuthTopBar` + `$t('forgetPassword.title')`，模板首行）。
- Export：`default`（name ForgetPassword）（字面）
- 备注：认证页面；使用 LoginLeftView/AuthTopBar；`router.push({ name: 'Login' })`。

`src/views/change/log/index.vue`
- 职责（字面）：更新日志页（按版本列表展示升级记录）。
- Export：`default`（name ChangeLog）（字面）

`src/views/dashboard/analysis/index.vue`
- 职责（字面）：分析看板页（栅格编排 8 个分析模块）。
- Export：`default`（name Analysis）（字面）

`src/views/dashboard/analysis/modules/customer-satisfaction.vue`
- 职责（字面）：客户满意度折线图卡片。
- Export：`default`（推断名 CustomerSatisfaction，无 defineOptions）（字面）

`src/views/dashboard/analysis/modules/sales-mapping-by-country.vue`
- 职责（字面）：全国销售分布环形图卡片。
- Export：`default`（推断名 SalesMappingByCountry，纯 template）（字面）

`src/views/dashboard/analysis/modules/target-vs-reality.vue`
- 职责（字面）：目标与实际柱状图 + 统计项卡片。
- Export：`default`（推断名 TargetVsReality）；`RevenueDataItem` interface（字面）

`src/views/dashboard/analysis/modules/today-sales.vue`
- 职责（字面）：今日销售统计卡片。
- Export：`default`（推断名 TodaySales）；`SalesDataItem` interface（字面）

`src/views/dashboard/analysis/modules/top-products.vue`
- 职责（字面）：热门产品表格卡片（含热度进度与颜色分级）。
- Export：`default`（推断名 TopProducts）；`Product` interface；常量 `COLOR_THRESHOLDS`/`POPULARITY_COLORS`（字面）

`src/views/dashboard/analysis/modules/total-revenue.vue`
- 职责（字面）：总收入柱状图卡片（对比线上/线下）。
- Export：`default`（推断名 TotalRevenue）；`RevenueDataItem` interface（字面）

`src/views/dashboard/analysis/modules/visitor-insights.vue`
- 职责（字面）：访客洞察折线图卡片（新老客户全年趋势）。
- Export：`default`（推断名 VisitorInsights）（字面）

`src/views/dashboard/analysis/modules/volume-service-level.vue`
- 职责（字面）：业务量与服务水平堆叠柱状图卡片。
- Export：`default`（推断名 VolumeServiceLevel）；`VolumeServiceDataItem` interface（字面）

`src/views/dashboard/console/index.vue`
- 职责（字面）：工作台页（栅格编排 7 个控制台模块）。
- Export：`default`（name Console）（字面）

`src/views/dashboard/console/modules/about-project.vue`
- 职责（字面）：关于项目卡片。
- Export：`default`（推断名 AboutProject）（字面）

`src/views/dashboard/console/modules/active-user.vue`
- 职责（字面）：用户概述卡片（活跃用户柱状图与统计）。
- Export：`default`（推断名 ActiveUser）；`UserStatItem` interface（字面）

`src/views/dashboard/console/modules/card-list.vue`
- 职责（字面）：核心指标卡片组（访问次数/在线访客等）。
- Export：`default`（推断名 CardList）；`CardDataItem` interface（字面）

`src/views/dashboard/console/modules/dynamic-stats.vue`
- 职责（字面）：用户动态列表卡片。
- Export：`default`（推断名 DynamicStats）；`DynamicItem` interface（字面）

`src/views/dashboard/console/modules/new-user.vue`
- 职责（字面）：新用户表格卡片（头像/地区/性别/进度）。
- Export：`default`（推断名 NewUser）；`UserTableItem` interface（字面）

`src/views/dashboard/console/modules/sales-overview.vue`
- 职责（字面）：访问量折线图卡片。
- Export：`default`（推断名 SalesOverview）（字面）

`src/views/dashboard/console/modules/todo-list.vue`
- 职责（字面）：待办事项列表卡片（含完成勾选）。
- Export：`default`（推断名 TodoList）；`TodoItem` interface（字面）

`src/views/dashboard/ecommerce/index.vue`
- 职责（字面）：电子商务看板页（栅格编排 13 个电商模块）。
- Export：`default`（name Ecommerce）（字面）

`src/views/dashboard/ecommerce/modules/annual-sales.vue`
- 职责（字面）：年度销售额柱状图卡片。
- Export：`default`（推断名 AnnualSales，纯 template）（字面）

`src/views/dashboard/ecommerce/modules/banner.vue`
- 职责（字面，模板）：欢迎横幅（`ArtBasicBanner :title="`欢迎回来 ${userInfo.userName}`"`，模板首行）。
- Export：`default`（推断名 Banner）（字面）
- 备注：使用 `useUserStore().getUserInfo`。

`src/views/dashboard/ecommerce/modules/cart-conversion-rate.vue`
- 职责（字面）：购物车转化率折线卡片。
- Export：`default`（推断名 CartConversionRate，纯 template）（字面）

`src/views/dashboard/ecommerce/modules/hot-commodity.vue`
- 职责（字面）：热销商品卡片（本周销售排行）。
- Export：`default`（推断名 HotCommodity）；`WeeklyItem` interface（字面）

`src/views/dashboard/ecommerce/modules/hot-products-list.vue`
- 职责（字面）：热销产品表格卡片（库存状态与销售趋势）。
- Export：`default`（推断名 HotProductsList）；`ProductItem` interface；常量 `ANIMATION_DELAY`/`STOCK_THRESHOLD`（字面）

`src/views/dashboard/ecommerce/modules/product-sales.vue`
- 职责（字面）：销售量柱状图卡片。
- Export：`default`（推断名 ProductSales，纯 template）（字面）

`src/views/dashboard/ecommerce/modules/recent-transaction.vue`
- 职责（字面）：最近交易时间线卡片。
- Export：`default`（推断名 RecentTransaction）；`TimelineItem` interface（字面）

`src/views/dashboard/ecommerce/modules/sales-classification.vue`
- 职责（字面）：销售分类环形图卡片。
- Export：`default`（推断名 SalesClassification，纯 template）（字面）

`src/views/dashboard/ecommerce/modules/sales-growth.vue`
- 职责（字面）：增长率折线图卡片。
- Export：`default`（推断名 SalesGrowth，纯 template）（字面）

`src/views/dashboard/ecommerce/modules/sales-trend.vue`
- 职责（字面）：销售趋势双向对比柱状图卡片。
- Export：`default`（推断名 SalesTrend，纯 template）（字面）

`src/views/dashboard/ecommerce/modules/total-order-volume.vue`
- 职责（字面）：订单总量环形图卡片。
- Export：`default`（推断名 TotalOrderVolume，纯 template）（字面）

`src/views/dashboard/ecommerce/modules/total-products.vue`
- 职责（字面）：商品总数柱状图卡片。
- Export：`default`（推断名 TotalProducts，纯 template）（字面）

`src/views/dashboard/ecommerce/modules/transaction-list.vue`
- 职责（字面）：最近活动数据列表卡片。
- Export：`default`（推断名 TransactionList）；`TransactionItem` interface（字面）

`src/views/exception/403/index.vue`
- 职责（字面）：403 错误页（使用 ArtException）。
- Export：`default`（name Exception403）（字面）

`src/views/exception/404/index.vue`
- 职责（字面）：404 错误页（使用 ArtException）。
- Export：`default`（name Exception404）（字面）

`src/views/exception/500/index.vue`
- 职责（字面）：500 错误页（使用 ArtException）。
- Export：`default`（name Exception500）（字面）

`src/views/outside/Iframe.vue`
- 职责（字面，模板）：外链 iframe 容器页（`<iframe :src="iframeUrl">` + `v-loading`，模板首行）。
- Export：`default`（name IframeView）（字面）
- 备注：路由相关；`IframeRouteManager.getInstance().findByPath(route.path)` 取 `meta.link`。

`src/views/result/fail/index.vue`
- 职责（字面）：提交失败结果页（使用 ArtResultPage）。
- Export：`default`（name ResultFail）（字面）

`src/views/result/success/index.vue`
- 职责（字面）：提交成功结果页（使用 ArtResultPage）。
- Export：`default`（name ResultSuccess）（字面）

`src/views/safeguard/server/index.vue`
- 职责（字面）：服务器管理页（卡片展示 CPU/RAM/SWAP/DISK 使用率并模拟实时刷新）。
- Export：`default`（name SafeguardServer）；`ServerInfo` interface；`UPDATE_INTERVAL` 常量（字面）

### 3.18 src/views — examples / system / template / widgets

`src/views/examples/forms/index.vue`
- 职责（字面）：表单示例（演示 ArtForm 及动态表单项操作）。
- Export：`default`（未显式 defineOptions，推断名 forms/index）；`Emits` interface；`OptionItem` interface；`FormData` interface（字面）

`src/views/examples/forms/search-bar.vue`
- 职责（字面）：表格搜索栏示例（ArtSearchBar 基础/完整两种用法）。
- Export：`default`（推断名 forms/search-bar）；`Emits`/`OptionItem`/`BasicFormData`/`AdvancedFormData` interface（字面）

`src/views/examples/permission/button-auth/index.vue`
- 职责（字面）：按钮权限示例页面。
- Export：`default`（name PermissionButtonAuth）（字面）
- 备注：认证相关（useAuth().hasAuth 与 useUserStore）。

`src/views/examples/permission/page-visibility/index.vue`
- 职责（字面）：权限页面可见页面（仅超级管理员可见）。
- Export：`default`（name PermissionPageVisibility）（字面）
- 备注：认证相关（useUserStore().info 判断角色）。

`src/views/examples/permission/switch-role/index.vue`
- 职责（字面）：切换权限页面（切换用户身份模拟不同角色登录）。
- Export：`default`（name PermissionSwitchRole）（字面）
- 备注：认证相关（fetchLogin/fetchGetUserInfo）。

`src/views/examples/socket-chat/index.vue`
- 职责（字面）：WebSocket 连接示例（基于 WebSocketClient）。
- Export：`default`（name WidgetsSocketChat）（字面）

`src/views/examples/tables/basic.vue`
- 职责（字面）：基础表格（useTable + ArtTable）。
- Export：`default`（name UserMixedUsageExample）（字面）

`src/views/examples/tables/index.vue`
- 职责（字面）：高级表格能力展示（useTable 缓存、防抖搜索、多种刷新）。
- Export：`default`（name AdvancedTableDemo）；`UserListItem` type = `Api.SystemManage.UserListItem`（字面）

`src/views/examples/tables/tree.vue`
- 职责（字面）：左树右表示例页面。
- Export：`default`（name TreeTable）（字面）

`src/views/examples/tabs/index.vue`
- 职责（字面）：标签页示例页面（修改标题、获取信息、关闭标签）。
- Export：`default`（name TabsExample）（字面）
- 备注：路由/标签相关（useWorktabStore，routePath `/examples/tabs`）。

`src/views/system/menu/index.vue`
- 职责（字面）：菜单管理页面（ArtSearchBar + ArtTable + MenuDialog）。
- Export：`default`（name Menus）（字面）
- 备注：菜单相关。

`src/views/system/menu/modules/menu-dialog.vue`
- 职责（字面，模板）：菜单/按钮新增与编辑弹窗（`ElDialog :title="dialogTitle"`，模板首行）。
- Export：`default`（推断名 menu-dialog）；`MenuFormData`/`Props`/`Emits` interface（字面）
- 备注：菜单相关。

`src/views/system/nested/menu1/index.vue`
- 职责（字面）：占位页「菜单-1」。
- Export：`default`（推断名 menu1/index，无 script）（字面）
- 备注：菜单相关（嵌套路由示例）。

`src/views/system/nested/menu2/index.vue`
- 职责（字面）：占位页「菜单-2-1」。
- Export：`default`（推断名 menu2/index，无 script）（字面）
- 备注：菜单相关（嵌套路由示例）。

`src/views/system/nested/menu3/index.vue`
- 职责（字面）：占位页「菜单-3-1」。
- Export：`default`（推断名 menu3/index，无 script）（字面）
- 备注：菜单相关（嵌套路由示例）。

`src/views/system/nested/menu3/menu3-2/index.vue`
- 职责（字面）：占位页「菜单-3-2-1」。
- Export：`default`（推断名 menu3-2/index，无 script）（字面）
- 备注：菜单相关（嵌套路由示例）。

`src/views/system/role/index.vue`
- 职责（字面）：角色管理页面（RoleSearch + ArtTable + 两个弹窗）。
- Export：`default`（name Role）；`RoleListItem`/`RoleSearchFormParams` type（字面）
- 备注：权限相关（含菜单权限分配弹窗）。

`src/views/system/role/modules/role-edit-dialog.vue`
- 职责（字面，模板）：角色新增/编辑弹窗（`ElDialog :title="dialogType === 'add' ? '新增角色' : '编辑角色'"`，模板首行）。
- Export：`default`（推断名 role-edit-dialog）；`Props`/`Emits` interface（字面）

`src/views/system/role/modules/role-permission-dialog.vue`
- 职责（字面）：菜单权限弹窗（ElTree 勾选分配角色菜单权限）。
- Export：`default`（推断名 role-permission-dialog）；`Props`/`Emits` interface（字面）
- 备注：权限相关（读取 useMenuStore 菜单列表）。

`src/views/system/role/modules/role-search.vue`
- 职责（字面，模板）：角色管理搜索栏（`ArtSearchBar ref="searchBarRef" v-model="formData"`，模板首行）。
- Export：`default`（推断名 role-search）；`Props`/`Emits` interface（字面）

`src/views/system/user/index.vue`
- 职责（字面）：用户管理页面（UserSearch + ArtTable + UserDialog）。
- Export：`default`（name User）（字面）

`src/views/system/user/modules/user-dialog.vue`
- 职责（字面）：添加/编辑用户弹窗（ElForm 编辑用户名、手机号、性别、角色）。
- Export：`default`（推断名 user-dialog）；`Props`/`Emits` interface（字面）

`src/views/system/user/modules/user-search.vue`
- 职责（字面，模板）：用户管理搜索栏（`ArtSearchBar ref="searchBarRef" v-model="formData"`，模板首行）。
- Export：`default`（推断名 user-search）；`Props`/`Emits` interface（字面）

`src/views/system/user-center/index.vue`
- 职责（字面）：个人中心页面（展示并编辑当前用户信息）。
- Export：`default`（name UserCenter）（字面）

`src/views/template/banners/index.vue`
- 职责（字面，模板）：Banner 横幅用法展示（`ElRow` + ArtBasicBanner，模板首行）。
- Export：`default`（name TemplateBanners）（字面）

`src/views/template/calendar/index.vue`
- 职责（字面，模板）：日历页（`ElCalendar v-model="currentDate"`，模板首行）。
- Export：`default`（name TemplateCalendar）（字面）

`src/views/template/cards/index.vue`
- 职责（字面）：统计卡片展示（ArtStatsCard）。
- Export：`default`（name TemplateCards）（字面）

`src/views/template/charts/index.vue`
- 职责（字面）：图表属性配置展示（ArtBarChart 等）。
- Export：`default`（name TemplateCharts）（字面）

`src/views/template/chat/index.vue`
- 职责（字面）：聊天页（联系人列表 + 聊天展示模板）。
- Export：`default`（name TemplateChat）（字面）

`src/views/template/map/index.vue`
- 职责（字面，模板）：地图展示页（`ArtMapChart` + `element-loading-text="加载中..."`，模板首行）。
- Export：`default`（name TemplateMap）（字面）

`src/views/template/pricing/index.vue`
- 职责（字面）：定价模板（按 pricingPlans 渲染定价卡片）。
- Export：`default`（name Pricing）（字面）

`src/views/widgets/context-menu/index.vue`
- 职责（字面，模板）：右键菜单展示（`ElButton @contextmenu.prevent="showMenu"` + ArtMenuRight，模板首行）。
- Export：`default`（name TemplateContextMenu）（字面）

`src/views/widgets/count-to/index.vue`
- 职责（字面）：Count-To 组件展示（基于 VueUse useTransition）。
- Export：`default`（name TemplateCountTo）（字面）

`src/views/widgets/drag/index.vue`
- 职责（字面，模板/注释）：拖拽组件示例（源码注释指向 vue-draggable-plus.pages.dev + `ElRow`，文件首行）。
- Export：`default`（name TemplateDrag）（字面）

`src/views/widgets/excel/index.vue`
- 职责（字面，模板）：Excel 导入导出组件示例（`ArtExcelImport @import-success`/`@import-error` + ArtExcelExport，模板首行）。
- Export：`default`（name WidgetsExcel）；`TableData` interface（字面）

`src/views/widgets/fireworks/index.vue`
- 职责（字面，模板）：礼花/烟花效果组件示例（`ElSpace wrap` + 效果触发按钮，模板首行）。
- Export：`default`（name WidgetsFireworks）（字面）

`src/views/widgets/icon/index.vue`
- 职责（字面）：图标展示（Iconify/Remix Icon 的 ArtSvgIcon 用法）。
- Export：`default`（name IconPage）（字面）

`src/views/widgets/image-crop/index.vue`
- 职责（字面）：图片裁剪演示（ArtCutterImg 裁剪与预览）。
- Export：`default`（name WidgetsImageCrop）（字面）

`src/views/widgets/qrcode/index.vue`
- 职责（字面，模板）：二维码组件示例（`ElRow`/`ElCol` 栅格内的二维码展示，模板首行）。
- Export：`default`（name WidgetsQrcode）（字面）

`src/views/widgets/text-scroll/index.vue`
- 职责（字面，模板）：文字滚动公告组件示例（`<ArtTextScroll>` 基础用法，模板首行）。
- Export：`default`（name WidgetsTextScroll）（字面）

`src/views/widgets/video/index.vue`
- 职责（字面，模板）：视频播放器组件示例（`<ArtVideoPlayer>`，模板首行）。
- Export：`default`（name WidgetsVideo）（字面）

`src/views/widgets/wang-editor/index.vue`
- 职责（字面）：富文本编辑器演示（完整/简化工具栏 ArtWangEditor）。
- Export：`default`（name WidgetsWangEditor）（字面）

`src/views/widgets/watermark/index.vue`
- 职责（字面）：水印展示（基础文字/多行文字/图片水印，ElWatermark）。
- Export：`default`（name Watermark）（字面）

## 4. 配置与路由的字面内容

### 4.1 静态路由表（`src/router/routes/staticRoutes.ts` 的 `staticRoutes`）

| path | name | component | meta 关键字段 |
|---|---|---|---|
| `/auth/login` | Login | `@views/auth/login/index.vue` | `{ title: 'menus.login.title', isHideTab: true }` |
| `/auth/register` | Register | `@views/auth/register/index.vue` | `{ title: 'menus.register.title', isHideTab: true }` |
| `/auth/forget-password` | ForgetPassword | `@views/auth/forget-password/index.vue` | `{ title: 'menus.forgetPassword.title', isHideTab: true }` |
| `/403` | Exception403 | `@views/exception/403/index.vue` | `{ title: '403', isHideTab: true }` |
| `/:pathMatch(.*)*` | Exception404 | `@views/exception/404/index.vue` | `{ title: '404', isHideTab: true }` |
| `/500` | Exception500 | `@views/exception/500/index.vue` | `{ title: '500', isHideTab: true }` |
| `/outside` | Outside | `@views/index/index.vue` | `{ title: 'menus.outside.title' }` |
| `/outside/iframe/:path`（子） | Iframe | `@/views/outside/Iframe.vue` | `{ title: 'iframe' }` |

注：`/welcome` 示例路由在源文件中为注释状态。

### 4.2 动态路由模块（`src/router/modules/*.ts`，即菜单路由记录）

> 说明：下列每条子路由以「完整 path」（父 path + 子 path）呈现，格式为 `完整 path` / name / component；component 为源码字面（不含 `@/` 前缀时为 views 相对路径）。父级 `component: '/index/index'` 即布局容器。

- **dashboardRoutes**：父 `/dashboard`（name Dashboard，component `/index/index`，meta.title `menus.dashboard.title`，icon `ri:pie-chart-line`，roles `[R_SUPER, R_ADMIN]`）
  - `/dashboard/console` / Console / `/dashboard/console`（title menus.dashboard.console，icon ri:home-smile-2-line，fixedTab true，keepAlive false）
  - `/dashboard/analysis` / Analysis / `/dashboard/analysis`（title menus.dashboard.analysis，icon ri:align-item-bottom-line，keepAlive false）
  - `/dashboard/ecommerce` / Ecommerce / `/dashboard/ecommerce`（title menus.dashboard.ecommerce，icon ri:bar-chart-box-line，keepAlive false）
- **templateRoutes**：父 `/template`（name Template，component `/index/index`，title menus.template.title，icon ri:apps-2-line）
  - `/template/cards`/Cards、`/template/banners`/Banners、`/template/charts`/Charts（component 同名，keepAlive false）
  - `/template/map`/Map、`/template/chat`/Chat、`/template/calendar`/Calendar、`/template/pricing`/Pricing（component 同名；pricing 带 `isFullPage: true`；此四项 keepAlive true）
- **widgetsRoutes**：父 `/widgets`（name Widgets，component `/index/index`，title menus.widgets.title，icon ri:apps-2-add-line）
  - `/widgets/icon`/Icon、`/widgets/image-crop`/ImageCrop、`/widgets/excel`/Excel、`/widgets/video`/Video、`/widgets/wang-editor`/WangEditor、`/widgets/watermark`/Watermark、`/widgets/context-menu`/ContextMenu、`/widgets/qrcode`/Qrcode、`/widgets/drag`/Drag、`/widgets/text-scroll`/TextScroll、`/widgets/fireworks`/Fireworks（showTextBadge 'Hot'）— 以上 component 同名，keepAlive true
  - `/widgets/count-to`/CountTo（component `/widgets/count-to`，keepAlive false）
  - `/outside/iframe/elementui` / ElementUI / component ''（link `https://element-plus.org/zh-CN/component/overview.html`，isIframe true，keepAlive false）
- **examplesRoutes**：父 `/examples`（name Examples，component `/index/index`，title menus.examples.title，icon ri:sparkling-line）
  - `/examples/permission`/Permission（component ''，含子项：`/examples/permission/switch-role`/PermissionSwitchRole、`/examples/permission/button-auth`/PermissionButtonAuth（authList add/edit/delete/export/view/publish/config/manage）、`/examples/permission/page-visibility`/PermissionPageVisibility（roles `[R_SUPER]`））
  - `/examples/tabs`/Tabs、`/examples/tables/basic`/TablesBasic、`/examples/tables`/Tables、`/examples/forms`/Forms、`/examples/form/search-bar`/SearchBar（component `/examples/forms/search-bar`，注意 path 为 `form/search-bar` 而 component 为 `forms/search-bar`）、`/examples/tables/tree`/TablesTree、`/examples/socket-chat`/SocketChat
- **systemRoutes**：父 `/system`（name System，component `/index/index`，roles `[R_SUPER, R_ADMIN]`，title menus.system.title，icon ri:user-3-line）
  - `/system/user`/User（roles `[R_SUPER, R_ADMIN]`）、`/system/role`/Role（roles `[R_SUPER]`）、`/system/user-center`/UserCenter（isHide true, isHideTab true）、`/system/menu`/Menus（roles `[R_SUPER]`，authList add/edit/delete）
  - `/system/nested`/Nested（component ''，子项：`/system/nested/menu1`/NestedMenu1、`/system/nested/menu2`/NestedMenu2（component ''，含 `/system/nested/menu2/menu2-1`/NestedMenu2-1）、`/system/nested/menu3`/NestedMenu3（component ''，含 `/system/nested/menu3/menu3-1`/NestedMenu3-1、`/system/nested/menu3/menu3-2`/NestedMenu3-2（component ''，含 `/system/nested/menu3/menu3-2/menu3-2-1`/NestedMenu3-2-1）））
- **articleRoutes**：父 `/article`（name Article，component `/index/index`，roles `[R_SUPER, R_ADMIN]`，title menus.article.title）
  - `/article/article-list`/ArticleList（component `/article/list`，authList add/edit）、`/article/detail/:id`/ArticleDetail（component `/article/detail`，isHide true，activePath `/article/article-list`）、`/article/comment`/ArticleComment（component `/article/comment`）、`/article/publish`/ArticlePublish（component `/article/publish`，authList add）
- **resultRoutes**：父 `/result`（name Result，component `/index/index`，title menus.result.title）— `/result/success`/ResultSuccess、`/result/fail`/ResultFail
- **exceptionRoutes**：父 `/exception`（name Exception，component `/index/index`，title menus.exception.title）— `/exception/403`/Exception403、`/exception/404`/Exception404、`/exception/500`/Exception500（均 title 对应 menus.exception.forbidden/notFound/serverError，isHideTab true, isFullPage true, keepAlive true）
- **safeguardRoutes**：父 `/safeguard`（name Safeguard，component `/index/index`，meta.keepAlive false）— `/safeguard/server`/SafeguardServer（keepAlive true）
- **helpRoutes**（数组，非嵌套）：Document（path ''，link WEB_LINKS.DOCS，isIframe false）、LiteVersion（path ''，link WEB_LINKS.LiteVersion）、OldVersion（path ''，link WEB_LINKS.OldVersion）、ChangeLog（`/change/log`，title menus.plan.log，showTextBadge `v${__APP_VERSION__}`）

### 4.3 菜单标题 i18n 字面值（`src/locales/langs/zh.json` 的 `menus` 命名空间）

> 上游 ADP 菜单由 `router/modules/*.ts` 动态生成（见 4.2 节），本节只列 i18n 标题字面值，不代表菜单结构。

菜单标题字面值（i18n key → 中文，字面）：

- login.title 登录；register.title 注册；forgetPassword.title 忘记密码；outside.title 内嵌页面
- dashboard：title 仪表盘 / console 工作台 / analysis 分析页 / ecommerce 电子商务
- widgets：title 组件中心 / icon 图标 / imageCrop 图像裁剪 / excel Excel 导入导出 / video 视频播放器 / countTo 数字滚动 / wangEditor 富文本编辑器 / watermark 水印 / contextMenu 右键菜单 / qrcode 二维码 / drag 拖拽 / textScroll 文字滚动 / fireworks 礼花 / elementUI 组件总览
- template：title 模板中心 / chat 聊天 / cards 卡片 / banners 横幅 / charts 图表 / map 地图 / calendar 日历 / pricing 定价
- article：title 文章管理 / articleList 文章列表 / articleDetail 文章详情 / comment 留言管理 / articlePublish 文章发布
- result：title 结果页面 / success 成功页 / fail 失败页
- exception：title 异常页面 / forbidden 403 / notFound 404 / serverError 500
- examples：title 功能示例 / tabs 标签页 / tablesBasic 基础表格 / tables 高级表格 / tablesTree 左右布局表格 / forms 表单 / searchBar 搜索表单 / socketChat Socket 连接；permission：title 前端权限 / switchRole 切换权限 / buttonAuth 按钮权限演示 / pageVisibility 超级管理员可见
- system：title 系统管理 / user 用户管理 / role 角色管理 / userCenter 个人中心 / menu 菜单管理 / nested 嵌套菜单 / menu1 菜单1 / menu2 菜单2 / menu21 菜单2-1 / menu3 菜单3 / menu31 菜单3-1 / menu32 菜单3-2 / menu321 菜单3-2-1
- safeguard：title 运维管理 / server 服务器管理
- plan：title 版本计划 / log 更新日志
- help：title 帮助中心 / document 官方文档 / liteVersion 精简版本 / oldVersion v2.6.1 版本

### 4.4 全局组件配置（`src/config/modules/component.ts` 的 `globalComponentsConfig`）

| name | key | component（import 路径） | enabled |
|---|---|---|---|
| 设置面板 | settings-panel | `@/components/core/layouts/art-settings-panel/index.vue` | true |
| 全局搜索 | global-search | `@/components/core/layouts/art-global-search/index.vue` | true |
| 锁屏 | screen-lock | `@/components/core/layouts/art-screen-lock/index.vue` | true |
| 聊天窗口 | chat-window | `@/components/core/layouts/art-chat-window/index.vue` | true |
| 礼花效果 | fireworks-effect | `@/components/core/layouts/art-fireworks-effect/index.vue` | true |
| 水印效果 | watermark | `@/components/core/others/art-watermark/index.vue` | true |

判定函数（字面）：`getEnabledGlobalComponents()` 过滤 `config.enabled !== false`；`getGlobalComponentByKey(key)` 按 key 查找。

### 4.5 顶部栏功能配置（`src/config/modules/headerBar.ts` 的 `headerBarConfig`）

全部 `enabled: true`：menuButton、refreshButton、fastEnter、breadcrumb、globalSearch、fullscreen、notification、chat、language、settings、themeToggle（每项含 description 字段）。

## 5. 认证相关文件清单

仅列路径与 export，不写实现。

`src/views/auth/login/index.vue`
- Export：`default`（name Login）；`Account` interface；`AccountKey` type

`src/views/auth/register/index.vue`
- Export：`default`（name Register）
- 内部声明（非 export）：`RegisterForm` interface；`USERNAME_MIN_LENGTH`/`USERNAME_MAX_LENGTH`/`PASSWORD_MIN_LENGTH`/`REDIRECT_DELAY`

`src/views/auth/forget-password/index.vue`
- Export：`default`（name ForgetPassword）

`src/api/auth.ts`
- Export：`fetchLogin(params: Api.Auth.LoginParams)`；`fetchGetUserInfo()`

`src/router/guards/beforeEach.ts`
- Export：`setupBeforeEachGuard`；`getPendingLoading`；`resetPendingLoading`；`getRouteInitFailed`；`resetRouteInitState`；`resetRouterState`

`src/router/guards/afterEach.ts`
- Export：`setupAfterEachGuard`

`src/store/modules/user.ts`
- Export：`useUserStore`

`src/utils/http/index.ts`（请求封装等效文件）
- Export：`default`（api 对象：get/post/put/del/request）；内部拦截器与 401 处理函数

`src/utils/http/error.ts`
- Export：`ErrorResponse`；`ErrorLogData`；`class HttpError`；`handleError`；`showError`；`showSuccess`；`isHttpError`

`src/utils/http/status.ts`
- Export：`ApiStatus`（含 unauthorized=401、forbidden=403）

`src/hooks/core/useAuth.ts`
- Export：`useAuth()`

`src/hooks/core/useAppMode.ts`
- Export：`useAppMode()`

`src/directives/core/auth.ts`
- Export：`AuthDirective`；`setupAuthDirective`

`src/directives/core/roles.ts`
- Export：`RolesDirective`；`setupRolesDirective`

`src/router/core/MenuProcessor.ts`
- Export：`class MenuProcessor`

`src/router/core/RoutePermissionValidator.ts`
- Export：`class RoutePermissionValidator`

`src/utils/storage/storage.ts`
- Export：`getSystemStorage`；`getSysVersion`；`validateStorageData`；`checkStorageCompatibility`

`src/utils/storage/storage-config.ts`
- Export：`class StorageConfig`（含 LAST_USER_ID_KEY）

`src/components/core/views/login/AuthTopBar.vue`
- Export：`default`（name AuthTopBar）

`src/components/core/views/login/LoginLeftView.vue`
- Export：`default`；Props `{ hideContent? }`

`src/components/core/layouts/art-header-bar/widget/ArtUserMenu.vue`
- Export：`default`（name ArtUserMenu）

`src/components/core/layouts/art-screen-lock/index.vue`
- Export：`default`；`ENCRYPT_KEY`

`src/types/api/api.d.ts`
- Export：`Api.Auth.LoginParams`；`Api.Auth.LoginResponse`；`Api.Auth.UserInfo`

`src/types/directive/directive.d.ts`
- Export：`GlobalDirectives`（vAuth / vRoles）

`src/locales/langs/zh.json` / `en.json`
- Export：无 ES 导出；命名空间 `login`/`forgetPassword`/`register`/`lockScreen`

> 自检补充（A3，依据：路径或 export 含 auth/token/permission/role/user 等关键词，且参与认证/权限链路；均已在第 3 节全文索引，此处仅补认证视角入口）：

`src/api/system-manage.ts` — Export：`fetchGetUserList` / `fetchGetRoleList` / `fetchGetMenuList`（用户/角色/菜单数据源）

`src/router/routes/staticRoutes.ts` — Export：`staticRoutes`（登录/注册/忘记密码免鉴权路由）

`src/router/routes/asyncRoutes.ts` — Export：`asyncRoutes`（= `routeModules`，动态菜单路由源）

`src/router/modules/system.ts` — Export：`systemRoutes`（roles `[R_SUPER,R_ADMIN]`、menu/role 带 roles+authList）

`src/router/modules/examples.ts` — Export：`examplesRoutes`（permission 子项带 authList / roles `[R_SUPER]`）

`src/types/store/index.ts` — Export：`UserState`（用户认证状态类型）

`src/types/router/index.ts` — Export：`RouteMeta`（含 `authList`/`roles`/`authMark` 权限字段）

`src/components/core/forms/art-button-more/index.vue` — Export：`default`（name ArtButtonMore）；`ButtonMoreItem` interface（用 `useAuth().hasAuth` 过滤）

`src/utils/sys/upgrade.ts` — Export：`systemUpgrade`（升级日志可配置强制重新登录）

`src/views/examples/permission/button-auth/index.vue` / `page-visibility/index.vue` / `switch-role/index.vue` — 权限示例页（默认导出组件，分别演示 hasAuth / 角色可见 / fetchLogin 切角色）
