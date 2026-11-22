<!-- 登录页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">{{ $t('login.title') }}</h3>
          <p class="sub-title">{{ $t('login.subTitle') }}</p>

          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            :key="formKey"
            label-position="top"
            class="auth-form"
            :disabled="loading"
            @keyup.enter="handleSubmit"
          >
            <ElFormItem prop="email">
              <ElInput
                class="custom-height"
                :placeholder="$t('login.placeholder.email')"
                v-model.trim="formData.email"
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
                :placeholder="$t('login.placeholder.password')"
                v-model.trim="formData.password"
                type="password"
                autocomplete="current-password"
                show-password
              >
                <template #prefix>
                  <ArtSvgIcon icon="ri:lock-password-line" />
                </template>
              </ElInput>
            </ElFormItem>

            <!-- 凭据错误 / 服务异常提示 -->
            <ElAlert
              v-if="errorMessage"
              class="auth-error"
              type="error"
              :title="errorMessage"
              show-icon
              :closable="false"
            />

            <div style="margin-top: 24px">
              <ElButton
                :key="bounceKey"
                class="w-full custom-height motion-press"
                type="primary"
                :loading="loading"
                :disabled="loading"
                @click="handleSubmit"
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>

            <div class="mt-5 text-sm text-gray-600">
              <span>{{ $t('login.noAccount') }}</span>
              <RouterLink class="text-theme" :to="{ name: 'Register' }">{{
                $t('login.register')
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
  import { useUserStore } from '@/store/modules/user'
  import { HttpError } from '@/utils/http/error'
  import { fetchLogin } from '@/api/auth'
  import { useBounce } from '@/hooks/core/useBounce'

  defineOptions({ name: 'Login' })

  const { t, locale } = useI18n()
  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()
  const { bounceKey, triggerBounce } = useBounce()

  const formRef = ref<FormInstance>()
  const formKey = ref(0)
  const loading = ref(false)
  const errorMessage = ref('')

  const formData = reactive({
    email: '',
    password: ''
  })

  // 监听语言切换，重置表单
  watch(locale, () => {
    formKey.value++
  })

  const rules = computed<FormRules>(() => ({
    email: [
      { required: true, message: t('login.rule.emailRequired'), trigger: 'blur' },
      { type: 'email', message: t('login.rule.emailInvalid'), trigger: ['blur', 'change'] }
    ],
    password: [
      { required: true, message: t('login.rule.passwordRequired'), trigger: 'blur' },
      { min: 8, message: t('login.rule.passwordLength'), trigger: 'blur' }
    ]
  }))

  onMounted(() => {
    // 注册页跳转过来时预填邮箱
    const email = route.query.email
    if (typeof email === 'string' && email) {
      formData.email = email
    }
  })

  // 登录
  const handleSubmit = async () => {
    if (!formRef.value || loading.value) return

    errorMessage.value = ''

    try {
      // 表单验证
      // validate() 在校验不通过时会 reject，这里统一转成 false
      const valid = await formRef.value.validate().catch(() => false)
      if (!valid) return

      loading.value = true

      // 登录请求
      const { accessToken } = await fetchLogin({
        email: formData.email,
        password: formData.password
      })

      if (!accessToken) {
        throw new HttpError(t('auth.sessionExpired'), 401)
      }

      // 存储 token 和登录状态（access token 仅保存在内存）
      userStore.setToken(accessToken)
      userStore.setLoginStatus(true)

      // 登录成功处理
      triggerBounce()
      ElMessage.success(t('auth.loginSuccess'))

      // 跳转：优先回跳 redirect，其次进入工作台
      const redirect = route.query.redirect as string
      await router.push(redirect || '/dashboard')
    } catch (error) {
      if (error instanceof HttpError) {
        // 凭据错误 / 服务异常：直接展示后端返回的消息
        errorMessage.value = error.message
      } else {
        console.error('[Login] Unexpected error:', error)
        errorMessage.value = t('httpMsg.requestFailed')
      }
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
  @import './style.css';
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
