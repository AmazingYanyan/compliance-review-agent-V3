<!-- 核对工作台：左侧原文区（图片 / 真实 PDF / 合成页图），右侧当前页识别文字 -->
<template>
  <div class="task-workbench art-full-height">
    <!-- 任务不存在 -->
    <ElCard v-if="!task" class="art-table-card">
      <div class="task-workbench__missing">
        <ElResult icon="warning" title="任务不存在" sub-title="该任务可能已被删除或链接有误。">
          <template #extra>
            <ElButton type="primary" @click="goTaskList">返回我的任务</ElButton>
          </template>
        </ElResult>
      </div>
    </ElCard>

    <template v-else>
      <!-- 紧凑任务栏：桌面优先单行，窄屏允许换行 -->
      <div class="task-workbench__bar">
        <ElTooltip :content="task.companyName" placement="top" :disabled="!nameTruncated">
          <h2 ref="titleRef" class="task-workbench__title">{{ task.companyName }}</h2>
        </ElTooltip>
        <div class="task-workbench__tags">
          <ElTag effect="plain" size="small">{{ CUSTOMER_TYPE_TEXT[task.customerType] }}</ElTag>
          <ElTag :type="TASK_STATUS_TAG[task.status]" effect="light" size="small">
            {{ TASK_STATUS_TEXT[task.status] }}
          </ElTag>
          <ElTag v-if="isReadOnly" type="info" effect="plain" size="small">只读</ElTag>
        </div>
        <span class="task-workbench__meta">任务编号：{{ task.id }}</span>
        <span class="task-workbench__meta">创建时间：{{ formatTaskTime(task.createdAt) }}</span>
        <ElButton size="small" class="task-workbench__back" @click="goTaskList">
          <ElIcon>
            <ArrowLeft />
          </ElIcon>
          返回我的任务
        </ElButton>
      </div>

      <!-- 缺少公司章程 -->
      <ElAlert
        v-if="!hasCharter"
        class="art-task-alert"
        type="warning"
        show-icon
        :closable="false"
        title="尚未上传公司章程"
        description="请在核对工作台补充公司章程后开始核对；补充完成前无法开展章程核对。"
      />

      <!-- 材料切换：顶部 Tabs 只做材料选择，下方是一套双栏预览区 -->
      <ElCard v-if="task.materials.length" class="art-table-card task-workbench__preview">
        <ElTabs v-model="activeMaterial" type="card">
          <ElTabPane
            v-for="material in task.materials"
            :key="material.id"
            :label="material.name"
            :name="material.id"
          />
        </ElTabs>

        <div class="task-preview">
          <div class="task-preview__body">
            <!-- 原文区：工具栏 + 原件 -->
            <section class="task-preview__source">
              <div class="task-preview__toolbar">
                <span class="task-preview__page">{{ pageLabel }}</span>
                <div class="task-preview__controls">
                  <ElButton size="small" :disabled="!hasSource || pageNo <= 1" @click="prevPage">
                    上一页
                  </ElButton>
                  <ElButton
                    size="small"
                    :disabled="!hasSource || pageNo >= totalPages"
                    @click="nextPage"
                  >
                    下一页
                  </ElButton>
                  <template v-if="isPdf">
                    <ElButton size="small" :disabled="!hasSource" @click="zoomOut">缩小</ElButton>
                    <ElButton size="small" :disabled="!hasSource" @click="zoomIn">放大</ElButton>
                    <ElButton
                      size="small"
                      :disabled="!hasSource || isFitWidth"
                      @click="fitWidth"
                    >
                      适应宽度
                    </ElButton>
                    <span class="task-preview__zoom">{{ zoomLabel }}</span>
                  </template>
                </div>
              </div>

              <div
                ref="imagePaneRef"
                class="task-preview__pane task-preview__pane--source"
                :class="{ 'task-preview__pane--pdf': isPdf }"
              >
                <!-- 真实 PDF：用 PDF.js 渲染 -->
                <PdfViewer
                  v-if="isPdf"
                  ref="pdfViewerRef"
                  :key="activeMaterial"
                  :source="pdfSource"
                  @page-change="handlePdfPageChange"
                  @total-change="handlePdfTotalChange"
                  @zoom-change="handlePdfZoomChange"
                  @load-error="handlePdfError"
                />
                <!-- 单张图片原件：直接显示原图 -->
                <img
                  v-else-if="isImage && imageSource"
                  class="task-preview__image"
                  :src="imageSource"
                  :alt="currentMaterial?.name ?? '材料'"
                />
                <!-- 合成页图序列：按页显示 -->
                <img
                  v-else-if="pageImage"
                  class="task-preview__image"
                  :src="pageImage"
                  :alt="`${currentMaterial?.name ?? '材料'} 第 ${pageNo} 页`"
                />
                <ElEmpty v-else description="暂无预览数据" :image-size="110" />
              </div>
            </section>

            <!-- 识别文字区：与原文区各自独立滚动 -->
            <section class="task-preview__text-col">
              <div class="task-preview__text-head">
                识别文字
                <span class="task-preview__hint">仅供阅读，不参与任务状态流转</span>
              </div>
              <div ref="textPaneRef" class="task-preview__pane task-preview__pane--text">
                <pre v-if="currentText" class="task-preview__text">{{ currentText }}</pre>
                <ElEmpty v-else description="暂无识别结果" :image-size="100" />
              </div>
            </section>
          </div>
        </div>
      </ElCard>

      <!-- 没有任何材料 -->
      <ElCard v-else class="art-table-card">
        <div class="task-workbench__missing">
          <ElEmpty description="该任务尚未上传任何材料" :image-size="120" />
        </div>
      </ElCard>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ArrowLeft } from '@element-plus/icons-vue'
  import { useWorktabStore } from '@/store/modules/worktab'
  import PdfViewer from '@/components/business/pdf-viewer/index.vue'
  import { getOcrPages, getPreviewSample } from '@/mock/previews'
  import {
    CUSTOMER_TYPE_TEXT,
    TASK_STATUS_TAG,
    TASK_STATUS_TEXT,
    formatTaskTime,
    getTaskById,
    hasCharter as hasCharterMaterial
  } from '@/mock/tasks'

  defineOptions({ name: 'TaskWorkbench' })

  const route = useRoute()
  const router = useRouter()
  const worktabStore = useWorktabStore()

  /** 任务 ID 随路由变化，保证切换任务后展示对应任务 */
  const taskId = computed(() => String(route.params.taskId ?? ''))

  /** 当前任务 */
  const task = computed(() => getTaskById(taskId.value))

  /** 是否为已完成任务的只读态 */
  const isReadOnly = computed(() => task.value?.status === 'completed')

  /** 是否已上传公司章程 */
  const hasCharter = computed(() => (task.value ? hasCharterMaterial(task.value) : false))

  /** 当前选中的材料 */
  const activeMaterial = ref('')

  /** 当前页码，从 1 开始 */
  const pageNo = ref(1)

  /** PDF 总页数与缩放倍率（由 PDF 预览组件回传） */
  const pdfTotal = ref(0)
  const pdfZoom = ref(1)

  /** 原文栏 / 文字栏滚动容器 */
  const imagePaneRef = ref<HTMLElement | null>(null)
  const textPaneRef = ref<HTMLElement | null>(null)

  /** PDF 预览组件实例 */
  const pdfViewerRef = ref<InstanceType<typeof PdfViewer> | null>(null)

  /** 企业名称是否被截断（决定是否用气泡展示全称） */
  const titleRef = ref<HTMLElement | null>(null)
  const nameTruncated = ref(false)

  /** 当前选中的材料对象 */
  const currentMaterial = computed(() =>
    task.value?.materials.find((material) => material.id === activeMaterial.value)
  )

  /** 当前材料的原件格式 */
  const materialFormat = computed(() => currentMaterial.value?.format ?? 'pages')

  /** 当前材料是否为真实 PDF */
  const isPdf = computed(() => materialFormat.value === 'pdf')

  /** 当前材料是否为单张图片 */
  const isImage = computed(() => materialFormat.value === 'image')

  /** PDF / 图片原件地址 */
  const pdfSource = computed(() => (isPdf.value ? (currentMaterial.value?.source ?? '') : ''))
  const imageSource = computed(() => (isImage.value ? (currentMaterial.value?.source ?? '') : ''))

  /** 当前材料的页图样例（只有页图序列格式才有） */
  const previewSample = computed(() =>
    currentMaterial.value ? getPreviewSample(taskId.value, currentMaterial.value.id) : undefined
  )

  /** 当前材料的识别文字（按页） */
  const ocrPages = computed(() =>
    currentMaterial.value ? getOcrPages(taskId.value, currentMaterial.value.id) : undefined
  )

  /** 当前材料的总页数 */
  const totalPages = computed(() => {
    if (isPdf.value) return pdfTotal.value
    if (isImage.value) return 1
    return previewSample.value?.pages.length ?? 0
  })

  /** 当前页的页图（页图序列格式） */
  const pageImage = computed(() => previewSample.value?.pages[pageNo.value - 1]?.image)

  /** 当前页的识别文字 */
  const currentText = computed(() => {
    if (!ocrPages.value?.length) return ''
    const targetPage = isImage.value ? 1 : pageNo.value
    return ocrPages.value.find((page) => page.pageNo === targetPage)?.text ?? ''
  })

  /** 原文区是否有可显示的内容 */
  const hasSource = computed(() => {
    if (isPdf.value) return Boolean(pdfSource.value) && pdfTotal.value > 0
    if (isImage.value) return Boolean(imageSource.value)
    return Boolean(pageImage.value)
  })

  /** 页码文案 */
  const pageLabel = computed(() =>
    totalPages.value > 0 ? `第 ${pageNo.value} / ${totalPages.value} 页` : '暂无页码'
  )

  /** 缩放文案 */
  const zoomLabel = computed(() => `${Math.round(pdfZoom.value * 100)}%`)

  /** 当前是否已经是适应宽度 */
  const isFitWidth = computed(() => pdfZoom.value === 1)

  // 任务或材料变化时，确保选中项始终有效
  watch(
    task,
    (value) => {
      const ids = value?.materials.map((material) => material.id) ?? []
      activeMaterial.value = ids.includes(activeMaterial.value) ? activeMaterial.value : ids[0] ?? ''

      // 顶部标签页标题跟随当前任务，切换任务后不残留上一条任务信息
      worktabStore.updateTabTitle(route.path, value ? value.companyName : '')
    },
    { immediate: true }
  )

  /** 企业名称被截断时允许用气泡查看全称 */
  const checkNameTruncated = () => {
    const el = titleRef.value
    nameTruncated.value = Boolean(el && el.scrollWidth > el.clientWidth)
  }

  onMounted(() => {
    checkNameTruncated()
    window.addEventListener('resize', checkNameTruncated)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', checkNameTruncated)
  })

  /** 重置滚动位置 */
  const resetScroll = (resetSource = true) => {
    nextTick(() => {
      if (resetSource && imagePaneRef.value) imagePaneRef.value.scrollTop = 0
      if (textPaneRef.value) textPaneRef.value.scrollTop = 0
    })
  }

  /** 切换材料：页码回到第 1 页、清空上一份材料的内容与状态 */
  watch(activeMaterial, () => {
    pageNo.value = 1
    pdfTotal.value = 0
    pdfZoom.value = 1
    resetScroll()
    nextTick(checkNameTruncated)
  })

  /** 翻页后回到当前页顶部（PDF 由组件内部滚动，不在此处理） */
  watch(pageNo, () => {
    resetScroll(!isPdf.value)
  })

  /** 上一页 */
  const prevPage = () => {
    if (pageNo.value <= 1) return
    if (isPdf.value) {
      pdfViewerRef.value?.goToPage(pageNo.value - 1)
      return
    }
    pageNo.value -= 1
  }

  /** 下一页 */
  const nextPage = () => {
    if (pageNo.value >= totalPages.value) return
    if (isPdf.value) {
      pdfViewerRef.value?.goToPage(pageNo.value + 1)
      return
    }
    pageNo.value += 1
  }

  /** 放大 */
  const zoomIn = () => pdfViewerRef.value?.zoomIn()

  /** 缩小 */
  const zoomOut = () => pdfViewerRef.value?.zoomOut()

  /** 恢复适应宽度 */
  const fitWidth = () => pdfViewerRef.value?.fitWidth()

  /** PDF 滚动或翻页导致的当前页变化 */
  const handlePdfPageChange = (page: number) => {
    pageNo.value = page
  }

  /** PDF 总页数就绪 */
  const handlePdfTotalChange = (total: number) => {
    pdfTotal.value = total
  }

  /** PDF 缩放变化 */
  const handlePdfZoomChange = (zoom: number) => {
    pdfZoom.value = zoom
  }

  /** PDF 加载失败：左侧给出提示，仍可切回其它材料 */
  const handlePdfError = (message: string) => {
    pdfTotal.value = 0
    console.warn('[TaskWorkbench] PDF 加载失败', message)
  }

  /**
   * 返回我的任务
   */
  const goTaskList = () => {
    router.push({ name: 'TaskList' })
  }
</script>

<style lang="scss" scoped>
  .task-workbench {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }

  /* ---------- 紧凑任务栏 ---------- */
  .task-workbench__bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 8px 12px;
    background: var(--art-gray-100);
    border: 1px solid var(--art-gray-200);
    border-radius: 6px;
  }

  .task-workbench__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--art-gray-900);
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .task-workbench__tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .task-workbench__meta {
    font-size: 12px;
    color: var(--art-gray-600);
    white-space: nowrap;
  }

  .task-workbench__back {
    margin-left: auto;
  }

  .task-workbench__missing {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 0;
  }

  /* ---------- 双栏预览 ---------- */
  .task-workbench__preview {
    min-height: 0;

    :deep(.el-card__body) {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
  }

  .task-preview {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .task-preview__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
    flex: 1;
    min-height: 0;
  }

  /* 原文列：工具栏 + 原件 */
  .task-preview__source {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
  }

  /* 原文区紧凑工具栏：页码、翻页与 PDF 缩放 */
  .task-preview__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
    height: 32px;
    padding: 0 8px;
    background: var(--art-gray-100);
    border: 1px solid var(--art-gray-200);
    border-radius: 6px;
  }

  .task-preview__page {
    font-size: 13px;
    color: var(--art-gray-700);
    white-space: nowrap;
  }

  .task-preview__controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .task-preview__zoom {
    font-size: 12px;
    color: var(--art-gray-600);
    min-width: 56px;
    text-align: right;
  }

  /* 识别文字列 */
  .task-preview__text-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
  }

  .task-preview__text-head {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding: 0 8px;
    font-size: 13px;
    color: var(--art-gray-700);
    background: var(--art-gray-100);
    border: 1px solid var(--art-gray-200);
    border-radius: 6px;
  }

  .task-preview__hint {
    font-size: 12px;
    color: var(--art-gray-600);
  }

  /* 两栏各自独立滚动，占满剩余视口高度 */
  .task-preview__pane {
    flex: 1;
    min-height: 0;
    overflow: auto;
    border: 1px solid var(--art-gray-200);
    border-radius: 6px;
    background: var(--art-gray-100);
    padding: 12px;
  }

  /* PDF 由组件内部滚动，外层不再滚动 */
  .task-preview__pane--pdf {
    overflow: hidden;
    padding: 0;
  }

  .task-preview__pane--source {
    text-align: center;
  }

  .task-preview__image {
    display: block;
    width: 100%;
    height: auto;
  }

  .task-preview__text {
    margin: 0;
    font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', monospace;
    font-size: 13px;
    line-height: 1.8;
    color: var(--art-gray-800);
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* 窄屏：上下布局，避免整页横向溢出 */
  @media (max-width: 768px) {
    .task-workbench__title {
      max-width: 100%;
    }

    .task-workbench__back {
      margin-left: 0;
    }

    .task-preview__body {
      grid-template-columns: minmax(0, 1fr);
      overflow-y: auto;
    }

    .task-preview__pane {
      flex: none;
      height: 320px;
      overflow: auto;
    }

    .task-preview__pane--pdf {
      height: 60vh;
    }

    .task-preview__toolbar {
      height: auto;
      min-height: 32px;
      padding: 4px 8px;
      justify-content: flex-start;
    }
  }
</style>
