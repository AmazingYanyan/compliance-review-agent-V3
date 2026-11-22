/**
 * 快速入口配置
 * 包含：应用列表、快速链接等配置
 *
 * 交付界面默认关闭快速入口（见 `config/modules/headerBar.ts`），
 * 这里只保留本项目真实存在的路由，避免指向已删除的上游演示页面。
 */
import type { FastEnterConfig } from '@/types/config'

const fastEnterConfig: FastEnterConfig = {
  // 显示条件（屏幕宽度）
  minWidth: 1200,
  // 应用列表
  applications: [
    {
      name: '工作台',
      description: '合规审查任务总览',
      icon: 'ri:pie-chart-line',
      iconColor: '#377dff',
      enabled: true,
      order: 1,
      routeName: 'Dashboard'
    }
  ],
  // 快速链接
  quickLinks: [
    {
      name: '工作台',
      enabled: true,
      order: 1,
      routeName: 'Dashboard'
    }
  ]
}

export default Object.freeze(fastEnterConfig)
