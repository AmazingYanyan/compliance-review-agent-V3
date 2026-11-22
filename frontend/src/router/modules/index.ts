import { AppRouteRecord } from '@/types/router'

/**
 * 导出所有模块化路由
 *
 * 本轮采用「静态受保护路由」，不再启用上游的动态菜单路由，
 * 因此这里保留空数组以兼容 MenuProcessor 的类型引用。
 */
export const routeModules: AppRouteRecord[] = []
