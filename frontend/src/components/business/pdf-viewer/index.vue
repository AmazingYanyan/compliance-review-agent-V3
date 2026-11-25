<!--
  PDF 原文预览（CP8.2）

  用 PDF.js 在浏览器里渲染真实 PDF 文件，供核对工作台左侧原文区使用：
  - 默认「适应宽度」，连续滚动阅读，当前页 / 总页数随滚动更新；
  - 上一页 / 下一页滚动到对应页，缩放后仍停留在当前页；
  - 缩放档位固定为若干倍率，「适应宽度」随时可恢复；
  - 加载失败时在组件内提示，不影响页面切换到其它材料。

  Worker 使用**项目本地构建产物** `pdfjs-dist/build/pdf.worker.min.mjs`，
  通过 Vite 的 `?url` 导入拿到打包后的地址，开发模式与生产构建都能加载。
-->
<template>
  <div class="pdf-viewer">
    <!-- 加载失败 -->
    <div v-if="errorMessage" class="pdf-viewer__state">
      <ElResult icon="error" title="PDF 加载失败" :sub-title="errorMessage">
        <template #extra>
          <ElButton type="primary" @click="load">重新加载</ElButton>
        </template>
      </ElResult>
    </div>

    <!-- 加载中 -->
    <div v-else-if="loading" class="pdf-viewer__state">
      <ElResult icon="info" title="正在加载 PDF…" sub-title="首次加载需要启动本地 PDF.js Worker" />
    </div>

    <!-- 正文 -->
    <div v-else ref="scrollerRef" class="pdf-viewer__scroller" @scroll.passive="handleScroll">
      <div class="pdf-viewer__pages">
        <div
          v-for="page in pageSizes"
          :key="page.pageNo"
          :ref="(el) => setPageEl(page.pageNo, el)"
          class="pdf-viewer__page"
          :style="{ width: `${page.width}px`, height: `${page.height}px` }"
        >
          <canvas :ref="(el) => setCanvasEl(page.pageNo, el)" class="pdf-viewer__canvas" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import type { ComponentPublicInstance } from 'vue'
  import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
  import type { PDFDocumentProxy } from 'pdfjs-dist'
  import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

  defineOptions({ name: 'PdfViewer' })

  /** 使用项目本地构建的 Worker，开发与生产构建都不依赖 CDN */
  GlobalWorkerOptions.workerSrc = workerUrl

  const props = defineProps<{
    /** PDF 地址 */
    source: string
  }>()

  const emit = defineEmits<{
    /** 当前页变化（滚动或翻页触发） */
    (e: 'page-change', page: number): void
    /** 总页数就绪 */
    (e: 'total-change', total: number): void
    /** 缩放倍率变化（1 表示适应宽度） */
    (e: 'zoom-change', zoom: number): void
    /** 加载失败 */
    (e: 'load-error', message: string): void
  }>()

  /** 缩放档位（相对「适应宽度」的倍率） */
  const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3]
  /** 「适应宽度」所在的档位下标 */
  const FIT_ZOOM_INDEX = 2
  /** 页面左右留白 */
  const PAGE_GAP = 12
  /** 判断「当前页」的偏移阈值 */
  const PAGE_DETECT_OFFSET = 24

  const loading = ref(true)
  const errorMessage = ref('')
  const totalPages = ref(0)
  const currentPage = ref(1)
  const zoomIndex = ref(FIT_ZOOM_INDEX)
  const pageSizes = ref<{ pageNo: number; width: number; height: number }[]>([])

  const scrollerRef = ref<HTMLElement | null>(null)
  const pageEls = new Map<number, HTMLElement>()
  const canvasEls = new Map<number, HTMLCanvasElement>()

  let doc: PDFDocumentProxy | null = null
  let loadingTask: ReturnType<typeof getDocument> | null = null
  /** 页面原始宽度（scale = 1 时的 CSS 像素宽度） */
  let baseWidth = 0
  let scrollRaf = 0
  let resizeTimer = 0

  /** 缩放倍率（1 表示适应宽度） */
  const zoomRatio = computed(() => ZOOM_LEVELS[zoomIndex.value])

  /** 记录页面容器元素 */
  function setPageEl(pageNo: number, el: Element | ComponentPublicInstance | null): void {
    if (el instanceof HTMLElement) {
      pageEls.set(pageNo, el)
    } else {
      pageEls.delete(pageNo)
    }
  }

  /** 记录页面画布元素 */
  function setCanvasEl(pageNo: number, el: Element | ComponentPublicInstance | null): void {
    if (el instanceof HTMLCanvasElement) {
      canvasEls.set(pageNo, el)
    } else {
      canvasEls.delete(pageNo)
    }
  }

  /** 载入 PDF 并渲染全部页面 */
  async function load(): Promise<void> {
    loading.value = true
    errorMessage.value = ''
    pageSizes.value = []
    totalPages.value = 0
    currentPage.value = 1

    if (!props.source) {
      loading.value = false
      errorMessage.value = '缺少 PDF 文件地址'
      emit('load-error', errorMessage.value)
      return
    }

    try {
      const task = getDocument({ url: props.source })
      loadingTask = task
      const pdf = await task.promise
      doc = pdf
      totalPages.value = pdf.numPages

      const firstPage = await pdf.getPage(1)
      baseWidth = firstPage.getViewport({ scale: 1 }).width

      loading.value = false
      await nextTick()
      await renderPages()

      emit('total-change', totalPages.value)
      emit('page-change', 1)
      emit('zoom-change', zoomRatio.value)
    } catch (error) {
      loading.value = false
      const message = error instanceof Error ? error.message : String(error)
      errorMessage.value = message
      emit('load-error', message)
    }
  }

  /** 按当前缩放重新渲染全部页面 */
  async function renderPages(): Promise<void> {
    const pdf = doc
    const scroller = scrollerRef.value
    if (!pdf || !scroller || totalPages.value === 0) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const available = Math.max(scroller.clientWidth - PAGE_GAP * 2, 160)
    const scale = (available / baseWidth) * zoomRatio.value

    // 先算好每页尺寸，交给模板撑开滚动高度
    const sizes: { pageNo: number; width: number; height: number }[] = []
    for (let pageNo = 1; pageNo <= totalPages.value; pageNo++) {
      const page = await pdf.getPage(pageNo)
      const viewport = page.getViewport({ scale })
      sizes.push({
        pageNo,
        width: Math.max(Math.floor(viewport.width), 1),
        height: Math.max(Math.floor(viewport.height), 1)
      })
    }
    pageSizes.value = sizes
    await nextTick()

    // 再把每一页画到画布上
    for (let pageNo = 1; pageNo <= totalPages.value; pageNo++) {
      const canvas = canvasEls.get(pageNo)
      if (!canvas) continue

      const page = await pdf.getPage(pageNo)
      const viewport = page.getViewport({ scale: scale * dpr })
      canvas.width = Math.max(Math.floor(viewport.width), 1)
      canvas.height = Math.max(Math.floor(viewport.height), 1)

      const task = page.render({ canvas, viewport })
      await task.promise
    }
  }

  /** 滚动时更新当前页 */
  function handleScroll(): void {
    if (scrollRaf) return
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0
      syncCurrentPageByScroll()
    })
  }

  /** 依据滚动位置推算当前页 */
  function syncCurrentPageByScroll(): void {
    const scroller = scrollerRef.value
    if (!scroller) return

    const containerTop = scroller.getBoundingClientRect().top
    let current = 1
    for (const { pageNo } of pageSizes.value) {
      const el = pageEls.get(pageNo)
      if (!el) continue
      if (el.getBoundingClientRect().top - containerTop <= PAGE_DETECT_OFFSET) {
        current = pageNo
      }
    }

    if (current !== currentPage.value) {
      currentPage.value = current
      emit('page-change', current)
    }
  }

  /** 跳转到指定页 */
  function goToPage(pageNo: number, behavior: ScrollBehavior = 'smooth'): void {
    const target = Math.min(Math.max(Math.round(pageNo), 1), Math.max(totalPages.value, 1))
    const scroller = scrollerRef.value
    const el = pageEls.get(target)

    if (scroller && el) {
      const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
      scroller.scrollTo({ top, behavior })
    }

    if (target !== currentPage.value) {
      currentPage.value = target
      emit('page-change', target)
    }
  }

  /** 切换缩放档位 */
  async function setZoomIndex(index: number): Promise<void> {
    const next = Math.min(Math.max(index, 0), ZOOM_LEVELS.length - 1)
    if (next === zoomIndex.value) return

    const anchor = currentPage.value
    zoomIndex.value = next
    emit('zoom-change', zoomRatio.value)

    await renderPages()
    await nextTick()
    // 缩放后仍停留在原来那一页
    goToPage(anchor, 'auto')
  }

  /** 放大 */
  function zoomIn(): void {
    void setZoomIndex(zoomIndex.value + 1)
  }

  /** 缩小 */
  function zoomOut(): void {
    void setZoomIndex(zoomIndex.value - 1)
  }

  /** 恢复适应宽度 */
  function fitWidth(): void {
    void setZoomIndex(FIT_ZOOM_INDEX)
  }

  /** 容器宽度变化时，「适应宽度」档位需要重新排版 */
  let observer: ResizeObserver | null = null
  onMounted(() => {
    observer = new ResizeObserver(() => {
      if (zoomIndex.value !== FIT_ZOOM_INDEX || !doc) return
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        void renderPages()
      }, 150)
    })
    if (scrollerRef.value) {
      observer.observe(scrollerRef.value)
    }
    void load()
  })

  onBeforeUnmount(() => {
    if (scrollRaf) cancelAnimationFrame(scrollRaf)
    window.clearTimeout(resizeTimer)
    observer?.disconnect()
    observer = null
    pageEls.clear()
    canvasEls.clear()
    loadingTask?.destroy()
    loadingTask = null
    doc = null
  })

  watch(
    () => props.source,
    () => {
      void load()
    }
  )

  defineExpose({ goToPage, zoomIn, zoomOut, fitWidth, reload: load })
</script>

<style lang="scss" scoped>
  .pdf-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .pdf-viewer__state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
  }

  .pdf-viewer__scroller {
    flex: 1;
    min-height: 0;
    overflow: auto;
    /* 预留滚动条位置，避免出现/消失时反复重排 */
    scrollbar-gutter: stable;
    padding: 12px;
    background: var(--art-gray-100);
  }

  .pdf-viewer__pages {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: max-content;
    min-width: 100%;
  }

  .pdf-viewer__page {
    background: #fff;
    box-shadow: 0 1px 4px rgb(0 0 0 / 12%);
    overflow: hidden;
  }

  .pdf-viewer__canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
