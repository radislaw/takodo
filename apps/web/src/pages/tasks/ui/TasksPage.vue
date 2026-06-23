<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppScreenHeader } from '@/shared/ui'
import TaskListPane from './TaskListPane.vue'

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div
    class="surface-app pb-nav min-h-full lg:flex lg:h-full lg:min-h-0 lg:overflow-hidden lg:pb-0"
  >
    <!-- List pane -->
    <div
      class="lg:border-line lg:h-full lg:w-[380px] lg:flex-shrink-0 lg:overflow-y-auto lg:border-r"
    >
      <AppScreenHeader :title="t('tasks.title')" />

      <TaskListPane class="px-4 pt-6" />
    </div>

    <!-- Detail placeholder (desktop) -->
    <div class="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center">
      <p class="text-ink-soft font-body text-sm">{{ t('tasks.detail.selectHint') }}</p>
    </div>
  </div>
</template>
