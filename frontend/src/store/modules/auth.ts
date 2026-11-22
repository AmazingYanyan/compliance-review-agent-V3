/**
 * 认证配置状态管理模块
 *
 * 保存后端下发的公开认证配置（当前只有注册开关）。
 *
 * ## 主要功能
 *
 * - 拉取并缓存 `/api/v1/auth/config`
 * - 对外提供 `registrationEnabled`，用于隐藏注册入口、拦截注册路由
 *
 * @module store/modules/auth
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchAuthConfig } from '@/api/auth'

export const useAuthStore = defineStore('authStore', () => {
  /** 当前环境是否开放注册（默认开放，取到后端配置后为准） */
  const registrationEnabled = ref(true)
  /** 是否已拉取过配置 */
  const configLoaded = ref(false)
  /** 配置拉取中（避免并发重复请求） */
  let loading: Promise<void> | null = null

  /**
   * 拉取公开认证配置
   * 失败时保持默认「开放注册」，实际提交仍由后端 403 兜底
   */
  const loadAuthConfig = async (force = false): Promise<void> => {
    if (configLoaded.value && !force) return
    if (loading) return loading

    loading = (async () => {
      try {
        const config = await fetchAuthConfig()
        registrationEnabled.value = config.registrationEnabled
        configLoaded.value = true
      } catch (error) {
        console.warn('[AuthStore] 获取认证配置失败，按默认开放注册处理', error)
      } finally {
        loading = null
      }
    })()

    return loading
  }

  return {
    registrationEnabled,
    configLoaded,
    loadAuthConfig
  }
})
