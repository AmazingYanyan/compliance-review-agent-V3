<!-- 注册页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">{{ $t('register.title') }}</h3>
          <p class="sub-title">{{ $t('register.subTitle') }}</p>

          <ElForm
            class="auth-form"
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-position="top"
            :key="formKey"
            :disabled="loading"
          >
            <ElFormItem prop="displayName">
              <ElInput
                class="custom-height"
                v-model.trim="formData.displayName"
                :placeholder="$t('register.placeholder.displayName')"
                autocomplete="name"
                clearable
              >
                <template #prefix>
                  <ArtSvgIcon icon="ri:user-line" />
                </template>
              </ElInput>
            </ElFormItem>

            <ElFormItem prop="email">
              <ElInput
                class="custom-height"
                v-model.trim="formData.email"
                :placeholder="$t('register.placeholder.email')"
                autocomplete="email"
                clearable
              >
                <template #prefix>
                  <ArtSvgIcon icon="ri:mail-line" />
                </template>
              </ElInput>
            </ElFormItem>

            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                v-model.trim="formData.password"
                :placeholder="$t('register.placeholder.password')"
                type="password"
                autocomplete="new-password"
                show-password
              >
                <template #prefix>
                  <ArtSvgIcon icon="ri:lock-password-line" />
                </template>
              </ElInput>
            </ElFormItem>

            <ElFormItem prop="confirmPassword">
              <ElInput
                class="custom-height"
                v-model.trim="formData.confirmPassword"
                :placeholder="$t('register.placeholder.confirmPassword')"
                type="password"
                autocomplete="new-password"
                show-password
                @keyup.enter="register"
              >
                <template #prefix>
                  <ArtSvgIcon icon="ri:shield-check-line" />
                </template>
              </ElInput>
            </ElFormItem>

            <!-- 字段错误 / 服务异常提示 -->
            <ElAlert
              v-if="errorMessage"
              class="auth-error"
              type="error"
              :title="errorMessage"
              show-icon
              :closable="false"
            />

            <div style="margin-top: 15px">
              <ElButton
                :key="bounceKey"
                class="w-full custom-height motion-press"
                type="primary"
                :loading="loading"
                :disabled="loading"
                @click="register"
              >
                {{ $t('register.submitBtnText') }}
              </ElButton>
            </div>

            <div class="mt-5 text-sm text-g-600">
              <span>{{ $t('register.hasAccount') }}</span>
              <RouterLink class="text-theme" :to="{ name: 'Login' }">{{
                $t('register.toLogin')
              }}</RouterLink>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { HttpError } from '@/utils/http/error'
  import { fetchRegister } from '@/api/auth'
  import { useBounce } from '@/hooks/core/useBounce'

  defineOptions({ name: 'Register' })

  interface RegisterForm {
    displayName: string
    email: string
    password: string
    confirmPassword: string
  }

  const DISPLAY_NAME_MIN_LENGTH = 2
  const DISPLAY_NAME_MAX_LENGTH = 32
  const PASSWORD_MIN_LENGTH = 8
  /** 注册成功后跳转登录页的延迟，给出反馈时间 */
  const REDIRECT_DELAY = 900

  const { t, locale } = useI18n()
  const router = useRouter()
  const formRef = ref<FormInstance>()
  const { bounceKey, triggerBounce } = useBounce()

  const loading = ref(false)
  const formKey = ref(0)
  const errorMessage = ref('')

  // 监听语言切换，重置表单
  watch(locale, () => {
    formKey.value++
  })

  const formData = reactive<RegisterForm>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const rules = computed<FormRules>(() => ({
    displayName: [
      { required: true, message: t('register.rule.displayNameRequired'), trigger: 'blur' },
      {
        min: DISPLAY_NAME_MIN_LENGTH,
        max: DISPLAY_NAME_MAX_LENGTH,
        message: t('register.rule.displayNameLength'),
        trigger: 'blur'
      }
    ],
    email: [
      { required: true, message: t('register.rule.emailRequired'), trigger: 'blur' },
      { type: 'email', message: t('register.rule.emailInvalid'), trigger: ['blur', 'change'] }
    ],
    password: [
      { required: true, message: t('register.rule.passwordRequired'), trigger: 'blur' },
      { min: PASSWORD_MIN_LENGTH, message: t('register.rule.passwordLength'), trigger: 'blur' },
      {
        // 密码需同时包含字母和数字，与后端规则保持一致
        validator: (_rule, value: string, callback: (error?: Error) => void) => {
          if (!value || /^(?=.*[A-Za-z])(?=.*\d).+$/.test(value)) {
            callback()
          } else {
            callback(new Error(t('register.rule.passwordStrength')))
          }
        },
        trigger: 'blur'
      }
    ],
    confirmPassword: [
      { required: true, message: t('register.rule.confirmPasswordRequired'), trigger: 'blur' },
      {
        validator: (_rule, value: string, callback: (error?: Error) => void) => {
          if (!value || value === formData.password) {
            callback()
          } else {
            callback(new Error(t('register.rule.passwordMismatch')))
          }
        },
        trigger: 'blur'
      }
    ]
  }))

  // 注册
  const register = async () => {
    if (!formRef.value || loading.value) return

    errorMessage.value = ''

    try {
      // 表单验证（含两次密码一致性校验）
      // validate() 在校验不通过时会 reject，这里统一转成 false
      const valid = await formRef.value.validate().catch(() => false)
      if (!valid) return

      loading.value = true

      // 注册请求
      await fetchRegister({
        displayName: formData.displayName,
        email: formData.email,
        password: formData.password
      })

      // 注册成功：回登录页并预填邮箱
      triggerBounce()
      ElMessage.success(t('auth.registerSuccess'))

      setTimeout(() => {
        router.push({ name: 'Login', query: { email: formData.email } })
      }, REDIRECT_DELAY)
    } catch (error) {
      if (error instanceof HttpError) {
        // 邮箱重复（409）/ 字段校验（422）/ 服务异常
        errorMessage.value = error.message
      } else {
        console.error('[Register] Unexpected error:', error)
        errorMessage.value = t('httpMsg.requestFailed')
      }
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
  /* 与登录页共用同一份授权页容器样式（基线 00c7e78 的做法） */
  @import '../login/style.css';
</style>

<style lang="scss" scoped>
  .auth-form {
    margin-top: 25px;
  }

  .auth-error {
    margin-bottom: 4px;
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 4px;
    font-size: 13px;
    color: var(--art-gray-700);
  }
</style>
