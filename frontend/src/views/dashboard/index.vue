<!-- 工作台：用于验证认证链路的极简页面 -->
<template>
  <div class="dashboard-page min-h-screen w-full flex flex-col">
    <!-- 顶部 -->
    <header class="dashboard-header flex-cb border-b border-[var(--default-border)] px-6 py-4">
      <div class="flex-c gap-3">
        <ArtLogo class="icon" size="34" />
        <div>
          <h1 class="text-base font-medium text-g-900">{{ $t('dashboard.title') }}</h1>
          <p class="text-xs text-g-600">{{ $t('dashboard.sessionDesc') }}</p>
        </div>
      </div>

      <ElButton
        class="motion-press"
        type="danger"
        plain
        :loading="loggingOut"
        :disabled="loggingOut"
        @click="handleLogout"
      >
        <ArtSvgIcon icon="ri:logout-circle-line" class="text-base" />
        <span class="ml-1">{{ $t('dashboard.logout') }}</span>
      </ElButton>
    </header>

    <!-- 内容 -->
    <main class="flex-1 flex flex-col items-center justify-center px-4 py-10">
      <section class="dashboard-card w-full max-w-2xl rounded-custom-sm border border-[var(--art-card-border)] bg-box p-8 shadow-sm">
        <div class="flex-cb gap-4 border-b border-[var(--default-border)] pb-6">
          <div class="flex-c gap-4">
            <ElAvatar :size="52" class="dashboard-avatar">
              {{ avatarText }}
            </ElAvatar>
            <div>
              <p class="text-xs text-g-600">{{ $t('dashboard.profileTitle') }}</p>
              <h2 class="mt-1 text-xl font-medium text-g-900">
                {{ $t('dashboard.greeting', { name: displayName }) }}
              </h2>
            </div>
          </div>
          <ElTag type="success" effect="light" round>{{ $t('dashboard.signedIn') }}</ElTag>
        </div>

        <dl class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="info-item rounded-custom-sm bg-[var(--art-gray-100)] p-4">
            <dt class="text-xs text-g-600">{{ $t('dashboard.displayName') }}</dt>
            <dd class="mt-1 flex items-center gap-2 text-base font-medium text-g-900">
              <ArtSvgIcon icon="ri:user-line" class="text-g-500" />
              {{ displayName }}
            </dd>
          </div>
          <div class="info-item rounded-custom-sm bg-[var(--art-gray-100)] p-4">
            <dt class="text-xs text-g-600">{{ $t('dashboard.email') }}</dt>
            <dd class="mt-1 flex items-center gap-2 text-base font-medium text-g-900">
              <ArtSvgIcon icon="ri:mail-line" class="text-g-500" />
              <span class="break-all">{{ email }}</span>
            </dd>
          </div>
        </dl>

        <div class="mt-6 rounded-custom-sm border border-dashed border-[var(--default-border-dashed)] p-4">
          <p class="text-sm font-medium text-g-800">{{ $t('dashboard.sessionTitle') }}</p>
          <p class="mt-1 text-xs leading-relaxed text-g-600">{{ $t('dashboard.sessionDesc') }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import { useUserStore } from '@/store/modules/user'

  defineOptions({ name: 'Dashboard' })

  const { t } = useI18n()
  const userStore = useUserStore()
  const loggingOut = ref(false)

  const displayName = computed(() => userStore.getUserInfo.displayName || '-')
  const email = computed(() => userStore.getUserInfo.email || '-')
  const avatarText = computed(() => displayName.value.slice(0, 1).toUpperCase())

  // 退出登录：调用后端撤销 refresh 会话后再清理本地状态
  const handleLogout = async () => {
    if (loggingOut.value) return

    try {
      await ElMessageBox.confirm(t('dashboard.logoutConfirm'), t('dashboard.logout'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      })
    } catch {
      // 用户取消
      return
    }

    loggingOut.value = true
    try {
      await userStore.signOut()
      ElMessage.success(t('auth.logoutSuccess'))
    } finally {
      loggingOut.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .dashboard-page {
    background-color: var(--default-bg-color);
  }

  .dashboard-header {
    background-color: var(--default-box-color);
  }

  .dashboard-card {
    animation: dashboard-enter var(--motion-duration-slow, 400ms)
      var(--motion-easing-entrance, ease) both;
  }

  .dashboard-avatar {
    background-color: var(--el-color-primary);
    color: #fff;
    font-size: 20px;
  }

  .info-item {
    transition: transform var(--motion-duration-fast, 150ms) var(--motion-easing-standard, ease);

    &:hover {
      transform: translateY(-2px);
    }
  }

  @keyframes dashboard-enter {
    from {
      opacity: 0;
      transform: translateY(12px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dashboard-card {
      animation: none;
    }

    .info-item:hover {
      transform: none;
    }
  }
</style>
