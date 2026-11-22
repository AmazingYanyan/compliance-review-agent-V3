import { AppRouteRecordRaw } from '@/utils/router'
import { AppRouteRecord } from '@/types/router'

/**
 * 静态路由配置
 *
 * 本轮采用「静态受保护路由」：不再依赖上游的动态菜单 / 权限接口。
 * - `/auth/login`、`/auth/register`：匿名可访问；
 * - `/dashboard`：受保护，未登录时由路由守卫跳转到登录页。
 *
 * `/dashboard` 采用上游 ADP 的嵌套结构：父路由承载布局（`@views/index/index.vue`），
 * 子路由承载工作台内容页，布局的 `ArtPageContent` 通过 `RouterView` 渲染子级。
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
    component: () => import('@views/index/index.vue'),
    meta: { title: 'menus.dashboard.title', icon: 'ri:pie-chart-line' },
    children: [
      {
        path: '',
        name: 'DashboardWorkbench',
        component: () => import('@views/dashboard/index.vue'),
        meta: {
          title: 'menus.dashboard.title',
          icon: 'ri:pie-chart-line',
          keepAlive: true,
          fixedTab: true
        }
      }
    ]
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

/**
 * 本地静态菜单
 *
 * 侧栏菜单直接由本地路由提供，不接上游动态菜单 API。
 * 当前只保留「工作台」一个入口，后续「我的任务」页面开工时在此追加。
 *
 * `component` 字段是侧栏过滤菜单项的必需条件（见 `SidebarSubmenu.filterRoutes`）。
 */
export const staticMenuList: AppRouteRecord[] = [
  {
    path: DASHBOARD_PATH,
    name: 'DashboardWorkbench',
    component: '/dashboard/index',
    meta: {
      title: 'menus.dashboard.title',
      icon: 'ri:pie-chart-line'
    }
  }
]
