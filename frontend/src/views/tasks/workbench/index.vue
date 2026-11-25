<!-- 核对工作台（占位页） -->
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
      <!-- 任务信息 -->
      <ElCard class="art-task-info">
        <div class="task-workbench__header">
          <div class="task-workbench__meta">
            <h2 class="task-workbench__title">{{ task.companyName }}</h2>
            <div class="task-workbench__tags">
              <ElTag effect="plain">{{ CUSTOMER_TYPE_TEXT[task.customerType] }}</ElTag>
              <ElTag :type="TASK_STATUS_TAG[task.status]" effect="light">
                {{ TASK_STATUS_TEXT[task.status] }}
              </ElTag>
              <ElTag v-if="isReadOnly" type="info" effect="plain">只读</ElTag>
            </div>
          </div>
          <ElButton @click="goTaskList">
            <ElIcon>
              <ArrowLeft />
            </ElIcon>
            返回我的任务
          </ElButton>
        </div>
        <div class="task-workbench__extra">
          <span>任务编号：{{ task.id }}</span>
          <span>创建时间：{{ formatTaskTime(task.createdAt) }}</span>
        </div>
      </ElCard>

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
      <ElCard v-if="task.materials.length" class="art-table-card">
        <ElTabs v-model="activeMaterial" type="card">
          <ElTabPane
            v-for="material in task.materials"
            :key="material.id"
            :label="material.name"
            :name="material.id"
          />
        </ElTabs>

        <div class="task-preview">
          <div class="task-preview__toolbar">
            <div class="task-preview__material">
              <span class="task-preview__name">{{ currentMaterial?.name ?? '-' }}</span>
              <ElTag v-if="currentMaterial" effect="plain" size="small">
                {{ MATERIAL_TYPE_TEXT[currentMaterial.type] }}
              </ElTag>
              <span class="task-preview__hint">OCR 文字仅供阅读，不参与任务状态流转</span>
            </div>
            <div class="task-preview__pager">
              <ElButton :disabled="!hasSample || pageNo <= 1" @click="prevPage">上一页</ElButton>
              <span class="task-preview__page">{{ pageLabel }}</span>
              <ElButton :disabled="!hasSample || pageNo >= totalPages" @click="nextPage">下一页</ElButton>
            </div>
          </div>

          <!-- 双栏预览：左侧原件，右侧当前页 OCR 文字，两栏独立滚动 -->
          <div v-if="currentPage" class="task-preview__body">
            <div ref="imagePaneRef" class="task-preview__pane task-preview__pane--image">
              <img
                class="task-preview__image"
                :src="currentPage.image"
                :alt="`${currentMaterial?.name ?? '材料'} 第 ${currentPage.pageNo} 页`"
              />
            </div>
            <div ref="textPaneRef" class="task-preview__pane task-preview__pane--text">
              <pre class="task-preview__text">{{ currentPage.text }}</pre>
            </div>
          </div>

          <!-- 当前材料没有样例 -->
          <div v-else class="task-preview__empty">
            <ElEmpty description="暂无预览数据" :image-size="120" />
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
  import { getPreviewSample } from '@/mock/previews'
  import {
    CUSTOMER_TYPE_TEXT,
    MATERIAL_TYPE_TEXT,
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

  /** 原件栏 / 文字栏滚动容器 */
  const imagePaneRef = ref<HTMLElement | null>(null)
  const textPaneRef = ref<HTMLElement | null>(null)

  /** 当前选中的材料对象 */
  const currentMaterial = computed(() =>
    task.value?.materials.find((material) => material.id === activeMaterial.value)
  )

  /** 当前材料的预览样例（按 taskId + materialId 取，没有样例时为 undefined） */
  const previewSample = computed(() =>
    currentMaterial.value ? getPreviewSample(taskId.value, currentMaterial.value.id) : undefined
  )

  /** 当前材料是否有预览样例 */
  const hasSample = computed(() => (previewSample.value?.pages.length ?? 0) > 0)

  /** 当前材料的总页数 */
  const totalPages = computed(() => previewSample.value?.pages.length ?? 0)

  /** 当前页数据 */
  const currentPage = computed(() => previewSample.value?.pages[pageNo.value - 1])

  /** 页码文案；当前材料没有样例时不显示页码 */
  const pageLabel = computed(() =>
    hasSample.value ? `第 ${pageNo.value} / ${totalPages.value} 页` : '暂无页码'
  )

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

  /** 重置两栏滚动位置 */
  const resetScroll = () => {
    nextTick(() => {
      if (imagePaneRef.value) imagePaneRef.value.scrollTop = 0
      if (textPaneRef.value) textPaneRef.value.scrollTop = 0
    })
  }

  /** 切换材料：页码回到第 1 页，两栏滚动位置重置，不保留上一份材料的图文与滚动状态 */
  watch(activeMaterial, () => {
    pageNo.value = 1
    resetScroll()
  })

  /** 翻页后回到当前页顶部 */
  watch(pageNo, () => {
    resetScroll()
  })

  /** 上一页 */
  const prevPage = () => {
    if (pageNo.value > 1) pageNo.value -= 1
  }

  /** 下一页 */
  const nextPage = () => {
    if (pageNo.value < totalPages.value) pageNo.value += 1
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
  }

  .task-workbench__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .task-workbench__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .task-workbench__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .task-workbench__extra {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 12px;
    font-size: 13px;
    color: var(--art-gray-600);
  }

  .task-workbench__missing {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 0;
  }

  /* ---------- OCR 材料预览 ---------- */
  .task-preview {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .task-preview__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .task-preview__material {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
  }

  .task-preview__name {
    font-size: 15px;
    font-weight: 500;
    color: var(--art-gray-900);
  }

  .task-preview__hint {
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .task-preview__pager {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .task-preview__page {
    min-width: 88px;
    text-align: center;
    font-size: 13px;
    color: var(--art-gray-700);
  }

  /* 双栏：左侧原件、右侧当前页 OCR 文字，两栏各自独立滚动 */
  .task-preview__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  .task-preview__pane {
    height: clamp(320px, 52vh, 560px);
    overflow: auto;
    border: 1px solid var(--art-gray-200);
    border-radius: 6px;
    background: var(--art-gray-100);
    padding: 12px;
  }

  .task-preview__pane--image {
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

  .task-preview__empty {
    padding: 24px 0;
  }

  /* 窄屏：上下布局，翻页控件仍可用 */
  @media (max-width: 768px) {
    .task-preview__body {
      grid-template-columns: minmax(0, 1fr);
    }

    .task-preview__pane {
      height: 320px;
    }

    .task-preview__pager {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>
