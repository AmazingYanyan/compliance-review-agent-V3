<!-- 新建任务弹窗：企业名称 + 客户类型 -->
<template>
  <ElDialog
    v-model="dialogVisible"
    title="新建任务"
    width="480px"
    align-center
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="90px">
      <ElFormItem label="企业名称" prop="companyName">
        <ElInput
          v-model="formData.companyName"
          placeholder="请输入企业名称"
          maxlength="60"
          show-word-limit
          clearable
        />
      </ElFormItem>

      <ElFormItem label="客户类型" prop="customerType">
        <ElSelect v-model="formData.customerType" placeholder="请选择客户类型" class="w-full">
          <ElOption
            v-for="option in CUSTOMER_TYPE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">创建</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { CUSTOMER_TYPE_OPTIONS, type CustomerType } from '@/mock/tasks'

  interface Props {
    visible: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', payload: { companyName: string; customerType: CustomerType }): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  /** 防止连续点击重复创建 */
  const submitting = ref(false)

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const formData = reactive<{ companyName: string; customerType: CustomerType | '' }>({
    companyName: '',
    customerType: ''
  })

  const rules: FormRules = {
    companyName: [{ required: true, whitespace: true, message: '请输入企业名称', trigger: 'blur' }],
    customerType: [{ required: true, message: '请选择客户类型', trigger: 'change' }]
  }

  /**
   * 提交
   */
  const handleSubmit = async () => {
    if (!formRef.value || submitting.value) return

    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
      emit('submit', {
        companyName: formData.companyName.trim(),
        customerType: formData.customerType as CustomerType
      })
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  /**
   * 关闭后清理表单与校验状态
   */
  const handleClosed = () => {
    formData.companyName = ''
    formData.customerType = ''
    nextTick(() => formRef.value?.clearValidate())
  }
</script>
