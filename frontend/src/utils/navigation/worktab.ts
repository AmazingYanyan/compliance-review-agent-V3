/**
 * 工作标签页管理模块
 *
 * 根据路由导航自动创建 / 激活顶部工作标签页。
 *
 * 与上游实现的差异：去掉了 iframe 分支（上游依赖已删除的 `IframeRouteManager`，
 * 本项目当前不接入 iframe 页面）。
 *
 * @module utils/navigation/worktab
 */
import type { RouteLocationNormalized } from 'vue-router'
import { useWorktabStore } from '@/store/modules/worktab'
import { useSettingStore } from '@/store/modules/setting'
import { useCommon } from '@/hooks/core/useCommon'

/**
 * 根据当前路由信息设置工作标签页（worktab）
 * @param to 当前路由对象
 */
export const setWorktab = (to: RouteLocationNormalized): void => {
  const worktabStore = useWorktabStore()
  const { meta, path, name, params, query } = to

  if (meta.isHideTab) return

  if (useSettingStore().showWorkTab || path === useCommon().homePath.value) {
    worktabStore.openTab({
      title: meta.title as string,
      icon: meta.icon as string,
      path,
      name: name as string,
      keepAlive: meta.keepAlive as boolean,
      params,
      query,
      fixedTab: meta.fixedTab as boolean
    })
  }
}
