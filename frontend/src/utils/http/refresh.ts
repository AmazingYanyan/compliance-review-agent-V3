import axios from 'axios'
import { useUserStore } from '@/store/modules/user'

/**
 * 访问令牌刷新
 *
 * - refresh token 由后端通过 HttpOnly Cookie 下发，前端 JS 读不到；
 * - 刷新成功后只把新的 access token 放进内存（Pinia），不落 localStorage；
 * - 多个并发 401 共用同一次刷新请求（single-flight）。
 */

/** 独立于主拦截器的裸请求实例：刷新流程自身不能再触发 401 递归 */
const refreshClient = axios.create({
  timeout: 15000,
  baseURL: import.meta.env.VITE_API_URL || '/',
  withCredentials: true
})

/** 正在进行的刷新任务，保证并发请求只触发一次刷新 */
let refreshPromise: Promise<string> | null = null

/**
 * 刷新访问令牌
 * @returns 新的 access token
 */
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ code: number; msg: string; data: { accessToken: string } }>('/api/v1/auth/refresh')
      .then((response) => {
        const accessToken = response.data?.data?.accessToken
        if (!accessToken) {
          throw new Error('刷新会话失败：服务端未返回 accessToken')
        }
        const userStore = useUserStore()
        userStore.setToken(accessToken)
        userStore.setLoginStatus(true)
        return accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

/**
 * 是否正在刷新中（供调用方判断，避免重复触发）
 */
export function isRefreshing(): boolean {
  return refreshPromise !== null
}
