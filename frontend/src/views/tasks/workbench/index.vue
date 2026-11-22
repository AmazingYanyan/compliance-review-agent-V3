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

      <!-- 材料切换：单内容区替换显示 -->
      <ElCard v-if="task.materials.length" class="art-table-card">
        <ElTabs v-model="activeMaterial" type="card">
          <ElTabPane
            v-for="material in task.materials"
            :key="material.id"
            :label="material.name"
            :name="material.id"
          >
            <!-- 公司章程：核对占位 -->
            <div v-if="material.type === 'charter'" class="task-material">
              <p class="task-material__title">{{ material.name }}</p>
              <ElAlert
                type="info"
                show-icon
                :closable="false"
                title="章程核对区域占位"
                description="后续在此展示材料原文、摘录与出处，并支持对摘录作出接受或拒绝决定（拒绝需填写原因）。"
              />
            </div>

            <!-- 其他材料：暂未开放核对 -->
            <div v-else class="task-material">
              <p class="task-material__title">{{ material.name }}</p>
              <ElAlert
                type="info"
                show-icon
                :closable="false"
                title="本轮暂未开放核对"
                :description="`${material.name} 的核对能力将在后续阶段开放，当前仅展示材料占位信息。`"
              />
            </div>
          </ElTabPane>
        </ElTabs>
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

  .task-material {
    padding: 4px 0 12px;
  }

  .task-material__title {
    margin: 0 0 10px;
    font-size: 15px;
    font-weight: 500;
    color: var(--art-gray-900);
  }
</style>
