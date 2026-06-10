<script setup lang="ts">
import { computed } from 'vue'
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
  category?: string | null
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
  moveTomorrow: [entryId: string, taskId: string]
}>()

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()

const isDone = computed(() => props.task?.status === 'done')

const progressPct = computed(() => {
  if (!props.childTotal) return 0
  return Math.round(((props.childDone ?? 0) / props.childTotal) * 100)
})

const CAT_COLORS: Record<string, string> = {
  home: 'var(--cat-sage)',
  health: 'var(--cat-apricot)',
  work: 'var(--cat-blue)',
  self: 'var(--cat-mauve)',
}

const categoryColor = computed(() =>
  props.task?.category ? (CAT_COLORS[props.task.category] ?? 'var(--ink-faint)') : null,
)

const hasBottomRow = computed(
  () => !isDone.value && !!(props.task?.category || (props.childTotal && props.childTotal > 0)),
)

function handleToggleDone() {
  emit('toggleDone', props.entry.taskId, props.task?.status ?? 'open')
}

function handleToggleMit() {
  emit('toggleMit', props.entry.id, props.entry.isMIT)
}
</script>

<template>
  <div class="surface-card mb-2.5 cursor-pointer rounded-2xl px-3 py-3 shadow-sm">
    <div class="flex gap-3" :class="hasBottomRow ? 'items-start' : 'items-center'">
      <AppCheckbox
        class="flex-shrink-0"
        :class="{ 'mt-0.5': hasBottomRow }"
        :model-value="isDone"
        :aria-label="task?.title ?? '...'"
        @update:model-value="handleToggleDone"
      />

      <div class="min-w-0 flex-1">
        <button
          type="button"
          class="font-body text-ink w-full text-left text-sm leading-snug font-semibold"
          :class="{ 'line-through opacity-50': isDone }"
          @click="router.push(`/tasks/${entry.taskId}`)"
        >
          {{ task?.title ?? '...' }}
        </button>

        <!-- Category + progress row -->
        <div
          v-if="!isDone && (task?.category || (childTotal && childTotal > 0))"
          class="mt-1.5 flex items-center gap-3"
        >
          <div v-if="task?.category" class="flex items-center gap-1.5">
            <span
              class="h-2 w-2 flex-shrink-0 rounded-full"
              :style="{ background: categoryColor ?? '' }"
            />
            <span class="text-ink-soft text-xs font-semibold">
              {{ t(`category.${task.category}`) }}
            </span>
          </div>

          <div v-if="childTotal && childTotal > 0" class="flex min-w-0 flex-1 items-center gap-2">
            <div class="bg-line h-1.5 min-w-0 flex-1 overflow-hidden rounded-full">
              <div
                class="bg-sage h-full rounded-full transition-all duration-300 motion-reduce:transition-none"
                :style="{ width: `${progressPct}%` }"
              />
            </div>
            <span class="text-ink-soft flex-shrink-0 text-xs font-semibold">
              {{ childDone ?? 0 }}/{{ childTotal }}
            </span>
          </div>
        </div>
      </div>

      <!-- Start Do-mode with this task (active tasks only) -->
      <button
        v-if="!isDone"
        type="button"
        class="text-ink-soft hover:text-sage flex-shrink-0 cursor-pointer transition-colors"
        :class="{ 'mt-0.5': hasBottomRow }"
        :aria-label="t('do.startWith')"
        @click="router.push(`/do?task=${entry.taskId}`)"
      >
        <AppIcon name="play" :size="16" />
      </button>

      <!-- Move to tomorrow (active tasks only) -->
      <button
        v-if="!isDone"
        type="button"
        class="text-ink-soft hover:text-ink flex-shrink-0 cursor-pointer transition-colors"
        :class="{ 'mt-0.5': hasBottomRow }"
        :aria-label="t('today.moveTomorrow')"
        @click="emit('moveTomorrow', entry.id, entry.taskId)"
      >
        <AppIcon name="arrowR" :size="16" />
      </button>

      <!-- MIT button -->
      <button
        class="text-ink-soft hover:text-sage flex-shrink-0 cursor-pointer transition-colors"
        :class="{ 'mt-0.5': hasBottomRow }"
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
  </div>
</template>
