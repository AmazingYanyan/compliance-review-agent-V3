<!-- 任务列表搜索栏：企业名称 + 任务状态 -->
<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    @search="handleSearch"
    @reset="handleReset"
  >
  </ArtSearchBar>
</template>

<script setup lang="ts">
  import { TASK_STATUS_OPTIONS, type TaskListQuery } from '@/mock/tasks'

  interface Props {
    /** 筛选条件 */
    modelValue: TaskListQuery
  }

  interface Emits {
    (e: 'update:modelValue', value: TaskListQuery): void
    (e: 'search', params: TaskListQuery): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()

  // 表单数据双向绑定
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 搜索项配置：企业名称（子串匹配）+ 任务状态
  const formItems = computed(() => [
    {
      label: '企业名称',
      key: 'companyName',
      type: 'input',
      props: { placeholder: '请输入企业名称', clearable: true }
    },
    {
      label: '任务状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择任务状态',
        options: TASK_STATUS_OPTIONS
      }
    }
  ])

  /**
   * 搜索
   */
  function handleSearch(params: Record<string, any>) {
    emit('search', {
      companyName: (params.companyName ?? '').trim(),
      status: params.status ?? 'all'
    })
  }

  /**
   * 重置筛选条件
   */
  function handleReset() {
    emit('reset')
  }
</script>
