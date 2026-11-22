<!-- 工作台：合规审查任务的统一入口 -->
<template>
  <div class="dashboard-page">
    <div class="dashboard-inner">
      <h2 class="dashboard-title">{{ $t('dashboard.title') }}</h2>
      <p class="dashboard-subtitle">{{ $t('dashboard.subtitle') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'DashboardWorkbench' })
</script>

<style lang="scss" scoped>
  .dashboard-page {
    width: 100%;
    min-height: 100%;
    padding: 24px;
    background-color: var(--default-bg-color);
  }

  .dashboard-inner {
    max-width: 100%;
  }

  .dashboard-title {
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
    color: var(--art-gray-900);
  }

  .dashboard-subtitle {
    margin-top: 8px;
    font-size: 14px;
    line-height: 22px;
    color: var(--art-gray-600);
  }
</style>
