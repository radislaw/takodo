<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppCheckbox, AppIcon, AppBadge } from '@/shared/ui'

interface Entry {
  id: string
  taskId: string
  isMIT: boolean
}

interface Task {
  id: string
  title: string
  status: string
}

const props = defineProps<{
  entry: Entry
  task: Task | undefined
  childDone?: number
  childTotal?: number
}>()

const emit = defineEmits<{
  toggleDone: [taskId: string, currentStatus: string]
  toggleMit: [entryId: string, currentMIT: boolean]
}>()

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()

function handleToggleDone() {
  emit('toggleDone', props.entry.taskId, props.task?.status ?? 'open')
}

function handleToggleMit() {
  emit('toggleMit', props.entry.id, props.entry.isMIT)
}
</script>

<template>
  <div class="surface-card mb-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 shadow-sm">
    <AppCheckbox
      :model-value="task?.status === 'done'"
      :aria-label="task?.title ?? '...'"
      @update:model-value="handleToggleDone"
    />

    <button
      type="button"
      class="font-body text-ink min-w-0 flex-1 truncate text-left text-sm font-semibold"
      :class="{ 'line-through opacity-50': task?.status === 'done' }"
      @click="router.push(`/tasks/${entry.taskId}`)"
    >
      {{ task?.title ?? '...' }}
    </button>

    <span
      v-if="childTotal && childTotal > 0"
      class="text-ink-soft flex-shrink-0 text-xs font-semibold"
    >
      {{ t('tasks.progress', { done: childDone ?? 0, total: childTotal }) }}
    </span>

    <button
      class="text-ink-soft hover:text-sage flex-shrink-0 cursor-pointer transition-colors"
      :aria-label="t('today.mitLabel')"
      @click="handleToggleMit"
    >
      <AppBadge v-if="entry.isMIT" variant="done">
        <template #icon>
          <AppIcon name="zap" :size="12" />
        </template>
        <span class="hidden sm:inline">{{ t('today.mitLabel') }}</span>
      </AppBadge>
      <AppIcon v-else name="zap" :size="16" />
    </button>
  </div>
</template>
