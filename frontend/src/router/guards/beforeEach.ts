/**
 * 路由全局前置守卫模块
 *
 * 本轮采用「静态受保护路由 + 精简守卫」：
 * - 不再拉取上游动态菜单、不再调用权限接口，认证流程与菜单体系完全解耦；
 * - 受保护页面在进入前先向服务端确认会话（用 refresh cookie 换新 access token）；
 * - 已登录访问登录 / 注册页时统一跳转到 `/dashboard`。
 *
 * @module router/guards/beforeEach
 */
import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import NProgress from 'nprogress'
import { useSettingStore } from '@/store/modules/setting'
import { useUserStore } from '@/store/modules/user'
import { useMenuStore } from '@/store/modules/menu'
import { useAuthStore } from '@/store/modules/auth'
import { setPageTitle } from '@/utils/router'
import { setWorktab } from '@/utils/navigation/worktab'
import { RoutesAlias } from '../routesAlias'
import { DASHBOARD_PATH, staticMenuList } from '../routes/staticRoutes'
import { fetchGetUserInfo, adaptUserInfo } from '@/api/auth'
import { refreshAccessToken } from '@/utils/http/refresh'

/** 允许匿名访问的路径 */
const PUBLIC_PATHS = new Set<string>([
  RoutesAlias.Login,
  RoutesAlias.Register,
  '/403',
  '/404',
  '/500'
])

/**
 * 设置路由全局前置守卫
 */
export function setupBeforeEachGuard(router: Router): void {
  router.beforeEach(
    async (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      try {
        await handleRouteGuard(to, from, next, router)
      } catch (error) {
        console.error('[RouteGuard] 路由守卫处理失败:', error)
        next({ name: 'Exception500' })
      }
    }
  )
}

/**
 * 路由守卫主流程
 */
async function handleRouteGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router
): Promise<void> {
  const settingStore = useSettingStore()
  const userStore = useUserStore()

  // 启动进度条
  if (settingStore.showNprogress) {
    NProgress.start()
  }

  // 1. 根路径统一跳转到工作台
  if (to.path === '/') {
    next({ path: DASHBOARD_PATH, replace: true })
    return
  }

  // 2. 受保护页面：先向服务端确认会话，再决定放行或跳转登录页
  if (!PUBLIC_PATHS.has(to.path)) {
    const sessionReady = await ensureSession(userStore)
    if (!sessionReady) {
      next({ name: 'Login', query: { redirect: to.fullPath }, replace: true })
      return
    }
    // 会话就绪后恢复本地静态菜单（登出会清空菜单与首页路径）
    useMenuStore().setMenuList(staticMenuList)
  } else if (userStore.isLogin && isAuthPage(to.path)) {
    // 3. 已登录访问登录 / 注册页 → 跳回工作台
    next({ path: DASHBOARD_PATH, replace: true })
    return
  } else if (to.path === RoutesAlias.Register) {
    // 4. 注册关闭时，直接访问注册页也回到登录页
    const authStore = useAuthStore()
    await authStore.loadAuthConfig()
    if (!authStore.registrationEnabled) {
      next({ name: 'Login', replace: true })
      return
    }
  }

  // 5. 正常放行
  if (to.matched.length > 0) {
    setPageTitle(to)
    setWorktab(to)
    next()
    return
  }

  // 6. 未匹配到路由，跳转到 404
  next({ name: 'Exception404' })
}

/**
 * 是否是登录 / 注册页
 */
function isAuthPage(path: string): boolean {
  return path === RoutesAlias.Login || path === RoutesAlias.Register
}

/**
 * 确认会话是否有效
 *
 * - 内存中已有 access token：直接使用（必要时补拉用户信息）
 * - 没有 access token：调用 /api/v1/auth/refresh 用 refresh cookie 换新令牌
 *
 * @returns 会话是否可用
 */
async function ensureSession(userStore: ReturnType<typeof useUserStore>): Promise<boolean> {
  if (!userStore.accessToken) {
    try {
      await refreshAccessToken()
    } catch (error) {
      console.info('[RouteGuard] 无有效会话，跳转登录页')
      userStore.clearSession()
      return false
    }
  }

  // 拉取用户信息，保证页面能拿到显示名与邮箱
  try {
    await loadUserInfo(userStore)
  } catch (error) {
    console.error('[RouteGuard] 获取用户信息失败', error)
    userStore.clearSession()
    return false
  }

  return true
}

/**
 * 拉取并写入用户信息
 */
async function loadUserInfo(userStore: ReturnType<typeof useUserStore>): Promise<void> {
  const raw = await fetchGetUserInfo()
  userStore.setUserInfo(adaptUserInfo(raw))
  userStore.setLoginStatus(true)
  userStore.checkAndClearWorktabs()
}

/**
 * 重置路由相关状态
 */
export function resetRouterState(delay: number): void {
  setTimeout(() => {
    const menuStore = useMenuStore()
    menuStore.removeAllDynamicRoutes()
    menuStore.setMenuList([])
  }, delay)
}
