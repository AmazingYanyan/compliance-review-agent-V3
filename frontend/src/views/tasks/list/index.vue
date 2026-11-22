<!-- 我的任务列表 -->
<template>
  <div class="task-list-page art-full-height">
    <!-- 搜索栏 -->
    <TaskSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card">
      <!-- 表格工具栏 -->
      <ArtTableHeader v-model:columns="columnChecks" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="openCreateDialog" v-ripple>
              <ElIcon>
                <Plus />
              </ElIcon>
              新建任务
            </ElButton>
            <ElTag type="info" effect="plain">当前为模拟数据</ElTag>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 任务表格 -->
      <ArtTable
        v-if="taskRows.length"
        :data="taskRows"
        :columns="columns"
        row-key="id"
      >
        <!-- 企业名称 -->
        <template #companyName="{ row }">
          <div class="task-company">
            <span class="task-company__name">{{ row.companyName }}</span>
            <span class="task-company__id">任务编号：{{ row.id }}</span>
          </div>
        </template>

        <!-- 客户类型 -->
        <template #customerType="{ row }">
          <ElTag effect="plain">{{ getCustomerTypeText(row) }}</ElTag>
        </template>

        <!-- 任务状态 -->
        <template #status="{ row }">
          <ElTag :type="getStatusTagType(row)" effect="light">
            {{ getStatusText(row) }}
          </ElTag>
        </template>

        <!-- 操作 -->
        <template #operation="{ row }">
          <ElButton type="primary" link @click="goWorkbench(row)" v-ripple>
            {{ getActionText(row) }}
          </ElButton>
        </template>
      </ArtTable>

      <!-- 空状态：暂无任务 / 筛选无结果 -->
      <div v-else class="task-empty">
        <ElEmpty :description="emptyDescription" :image-size="120">
          <ElButton v-if="hasFilter" type="primary" @click="handleReset">重置筛选</ElButton>
          <ElButton v-else type="primary" @click="openCreateDialog">新建任务</ElButton>
        </ElEmpty>
      </div>
    </ElCard>

    <!-- 新建任务 -->
    <TaskCreateDialog v-model:visible="dialogVisible" @submit="handleCreate" />
  </div>
</template>

<script setup lang="ts">
  import { Plus } from '@element-plus/icons-vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import {
    CUSTOMER_TYPE_TEXT,
    TASK_STATUS_TAG,
    TASK_STATUS_TEXT,
    createTask,
    formatTaskTime,
    getListQuery,
    listTasks,
    matchTask,
    setListQuery,
    type CustomerType,
    type ReviewTask,
    type TaskListQuery,
    type TaskStatus
  } from '@/mock/tasks'
  import TaskSearch from './modules/task-search.vue'
  import TaskCreateDialog from './modules/task-create-dialog.vue'

  defineOptions({ name: 'TaskList' })

  /** 各状态在列表中的主操作 */
  const STATUS_ACTION_TEXT: Record<TaskStatus, string> = {
    pending: '开始',
    in_review: '继续核对',
    completed: '查看'
  }

  /** 客户类型文案（表格插槽的行数据为 any，统一在此收口类型） */
  const getCustomerTypeText = (row: ReviewTask) => CUSTOMER_TYPE_TEXT[row.customerType]

  /** 任务状态文案 */
  const getStatusText = (row: ReviewTask) => TASK_STATUS_TEXT[row.status]

  /** 任务状态标签色 */
  const getStatusTagType = (row: ReviewTask) => TASK_STATUS_TAG[row.status]

  /** 列表主操作文案 */
  const getActionText = (row: ReviewTask) => STATUS_ACTION_TEXT[row.status]

  const router = useRouter()

  /** 搜索表单（企业名称 + 任务状态） */
  const searchForm = ref<TaskListQuery>({ companyName: '', status: 'all' })
  /** 新建任务弹窗可见性 */
  const dialogVisible = ref(false)

  /** 当前列表数据 */
  const taskRows = ref<ReviewTask[]>([])

  /** 是否存在筛选条件 */
  const hasFilter = computed(
    () => Boolean(searchForm.value.companyName.trim()) || searchForm.value.status !== 'all'
  )

  /** 空状态文案 */
  const emptyDescription = computed(() =>
    hasFilter.value ? '未找到符合条件的任务' : '暂无任务'
  )

  const { columns, columnChecks } = useTableColumns(() => [
    {
      prop: 'companyName',
      label: '企业名称',
      minWidth: 220,
      useSlot: true
    },
    {
      prop: 'customerType',
      label: '客户类型',
      width: 110,
      useSlot: true
    },
    {
      prop: 'status',
      label: '任务状态',
      width: 110,
      useSlot: true
    },
    {
      prop: 'createdAt',
      label: '创建时间',
      width: 170,
      formatter: (row: ReviewTask) => formatTaskTime(row.createdAt)
    },
    {
      prop: 'operation',
      label: '操作',
      width: 110,
      fixed: 'right',
      useSlot: true
    }
  ])

  /**
   * 刷新列表
   */
  const refreshData = () => {
    taskRows.value = listTasks(searchForm.value)
  }

  /**
   * 搜索
   */
  const handleSearch = (params: TaskListQuery) => {
    searchForm.value = { ...params }
    setListQuery(searchForm.value)
    refreshData()
  }

  /**
   * 重置筛选条件
   */
  const handleReset = () => {
    searchForm.value = { companyName: '', status: 'all' }
    setListQuery(searchForm.value)
    refreshData()
  }

  /**
   * 打开新建任务弹窗
   */
  const openCreateDialog = () => {
    dialogVisible.value = true
  }

  /**
   * 新建任务
   *
   * 新任务为「待核对」；若当前筛选条件会把它隐藏，则同时清除企业名称与状态筛选。
   */
  const handleCreate = (payload: { companyName: string; customerType: CustomerType }) => {
    const task = createTask(payload)
    ElMessage.success('任务创建成功')

    if (!matchTask(task, searchForm.value)) {
      searchForm.value = { companyName: '', status: 'all' }
      setListQuery(searchForm.value)
      ElMessage.info('已清除筛选条件，可直接查看新任务')
    }

    refreshData()
  }

  /**
   * 进入核对工作台
   */
  const goWorkbench = (row: ReviewTask) => {
    router.push({ name: 'TaskWorkbench', params: { taskId: row.id } })
  }

  onMounted(() => {
    // 恢复上次离开列表时的搜索与筛选条件
    searchForm.value = getListQuery()
    refreshData()
  })
</script>

<style lang="scss" scoped>
  .task-company {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .task-company__name {
    font-size: 14px;
    font-weight: 500;
    color: var(--art-gray-900);
  }

  .task-company__id {
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .task-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 0;
  }
</style>
