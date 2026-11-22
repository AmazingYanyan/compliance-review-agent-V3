import request from '@/utils/http'

/**
 * 认证相关接口
 *
 * 统一响应结构由后端保证：`{ code, msg, data }`，
 * `utils/http` 已按 `code` 解包并只返回 `data`。
 *
 * 路径约定（与后端 HANDOFF.md 契约一致）：
 * - POST /api/v1/auth/register
 * - POST /api/v1/auth/login
 * - POST /api/v1/auth/refresh
 * - POST /api/v1/auth/logout
 * - GET  /api/v1/user/info
 */

/**
 * 注册
 * @param params 注册参数：显示名、邮箱、密码
 * @returns 注册成功的用户信息
 */
export function fetchRegister(params: Api.Auth.RegisterParams) {
  return request.post<Api.Auth.RegisterResponse>({
    url: '/api/v1/auth/register',
    params,
    // 字段级 / 业务级错误由页面自行展示，避免全局提示与页面提示重复
    showErrorMessage: false,
    // 注册失败（如邮箱已存在）属于业务错误，直接进入错误流程，不触发会话刷新
    skipAuthRefresh: true
  })
}

/**
 * 登录
 * @param params 登录参数：邮箱、密码
 * @returns 含 accessToken 的登录响应（refresh token 通过 HttpOnly Cookie 下发）
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return request.post<Api.Auth.LoginResponse>({
    url: '/api/v1/auth/login',
    params,
    showErrorMessage: false,
    // 登录失败（凭据错误）直接进入错误流程：
    // 不触发 refresh（避免把「邮箱或密码错误」覆盖成通用报错），也不清空当前会话
    skipAuthRefresh: true
  })
}

/**
 * 刷新访问令牌
 * 读取 refresh Cookie，轮换 refresh token，返回新的 accessToken
 * @returns 含 accessToken 的响应
 */
export function fetchRefreshToken() {
  return request.post<Api.Auth.LoginResponse>({
    url: '/api/v1/auth/refresh',
    showErrorMessage: false,
    // 刷新失败直接进入错误流程，不参与 401 自动刷新，避免递归
    skipAuthRefresh: true
  })
}

/**
 * 退出登录
 * 撤销当前 refresh 会话并清除 Cookie，可重复调用
 */
export function fetchLogout() {
  return request.post<null>({
    url: '/api/v1/auth/logout',
    showErrorMessage: false,
    skipAuthRefresh: true
  })
}

/**
 * 获取当前用户信息
 * @returns 后端原始用户信息
 */
export function fetchGetUserInfo() {
  return request.get<Api.Auth.RawUserInfo>({
    url: '/api/v1/user/info',
    showErrorMessage: false
  })
}

/**
 * 前端适配层：把后端用户信息补齐成上游组件期望的形状
 * @param raw 后端返回的 { id, displayName, email }
 * @returns 适配后的用户信息
 */
export function adaptUserInfo(raw: Api.Auth.RawUserInfo): Api.Auth.UserInfo {
  return {
    id: raw.id,
    displayName: raw.displayName,
    email: raw.email,
    userName: raw.displayName,
    username: raw.displayName,
    roles: ['R_USER'],
    buttons: []
  }
}
