/**
 * 公共路由别名
 * 存放系统级公共路由路径，如布局容器、登录页等
 */
export enum RoutesAlias {
  Layout = '/index/index', // 布局容器
  Login = '/auth/login', // 登录页
  Register = '/auth/register', // 注册页
  Dashboard = '/dashboard' // 工作台（受保护）
}
