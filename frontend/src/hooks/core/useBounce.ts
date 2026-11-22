import { ref } from 'vue'
import { prefersReducedMotion } from '@/config/motion'

/**
 * 轻量回弹动效
 *
 * 通过自增的 key 强制元素重建，保证同一元素上可以重复触发动画。
 * 当用户开启「减弱动效」时不触发动画。
 *
 * @example
 * const { bounceKey, triggerBounce } = useBounce()
 */
export function useBounce() {
  /** 用作元素 key，自增即触发一次动画 */
  const bounceKey = ref(0)

  /** 触发一次回弹 */
  const triggerBounce = () => {
    if (prefersReducedMotion()) return
    bounceKey.value += 1
  }

  return { bounceKey, triggerBounce }
}
