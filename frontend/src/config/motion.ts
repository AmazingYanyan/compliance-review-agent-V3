/**
 * 全局动效参数
 *
 * 统一管理本项目使用的动效时长、缓动曲线与缩放幅度，
 * 通过 CSS 自定义属性下发到样式层，避免魔法数字散落各处。
 *
 * 所有动效在 `prefers-reduced-motion: reduce` 下会被自动关闭
 * （见 `src/assets/styles/core/motion.scss`）。
 */
export const motionConfig = {
  /** 时长（毫秒） */
  duration: {
    /** 快速反馈：hover / 按压 */
    fast: 150,
    /** 常规过渡 */
    base: 250,
    /** 慢速过渡 */
    slow: 400,
    /** 回弹动画 */
    bounce: 420
  },
  /** 缓动曲线 */
  easing: {
    /** 通用过渡 */
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    /** 回弹入场 */
    entrance: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  },
  /** 缩放幅度 */
  scale: {
    /** 按下时的压缩 */
    press: 0.96,
    /** 回弹时的放大 */
    bounce: 1.03
  }
} as const

/**
 * 将动效参数写入 CSS 自定义属性
 * 在应用启动时调用一次
 */
export function applyMotionTokens(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const { duration, easing, scale } = motionConfig

  root.style.setProperty('--motion-duration-fast', `${duration.fast}ms`)
  root.style.setProperty('--motion-duration-base', `${duration.base}ms`)
  root.style.setProperty('--motion-duration-slow', `${duration.slow}ms`)
  root.style.setProperty('--motion-duration-bounce', `${duration.bounce}ms`)
  root.style.setProperty('--motion-easing-standard', easing.standard)
  root.style.setProperty('--motion-easing-entrance', easing.entrance)
  root.style.setProperty('--motion-scale-press', String(scale.press))
  root.style.setProperty('--motion-scale-bounce', String(scale.bounce))
}

/**
 * 用户是否要求减弱动效
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
