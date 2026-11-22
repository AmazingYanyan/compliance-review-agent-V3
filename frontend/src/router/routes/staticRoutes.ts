import { AppRouteRecordRaw } from '@/utils/router'

/**
 * 静态路由配置
 *
 * 本轮采用「静态受保护路由」：不再依赖上游的动态菜单 / 权限接口。
 * - `/auth/login`、`/auth/register`：匿名可访问；
 * - `/dashboard`：受保护，未登录时由路由守卫跳转到登录页。
 */
export const DASHBOARD_PATH = '/dashboard'

export const staticRoutes: AppRouteRecordRaw[] = [
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('@views/auth/login/index.vue'),
    meta: { title: 'menus.login.title', isHideTab: true }
  },
  {
    path: '/auth/register',
    name: 'Register',
    component: () => import('@views/auth/register/index.vue'),
    meta: { title: 'menus.register.title', isHideTab: true }
  },
  {
    path: DASHBOARD_PATH,
    name: 'Dashboard',
    component: () => import('@views/dashboard/index.vue'),
    meta: { title: 'menus.dashboard.title', isHideTab: true }
  },
  {
    path: '/403',
    name: 'Exception403',
    component: () => import('@views/exception/403/index.vue'),
    meta: { title: '403', isHideTab: true }
  },
  {
    path: '/500',
    name: 'Exception500',
    component: () => import('@views/exception/500/index.vue'),
    meta: { title: '500', isHideTab: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'Exception404',
    component: () => import('@views/exception/404/index.vue'),
    meta: { title: '404', isHideTab: true }
  }
]
