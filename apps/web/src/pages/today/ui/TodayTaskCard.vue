<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppCheckbox, AppIcon, AppBadge, AppActionSheet, ChildProgress } from '@/shared/ui'
import { formatFocusDuration } from '@/shared/lib/formatFocus'
import { CAT_COLORS } from '@/shared/lib/categories'

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
  focusSeconds?: number
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

const actionsOpen = ref(false)

const isDone = computed(() => props.task?.status === 'done')

const categoryColor = computed(() =>
  props.task?.category ? (CAT_COLORS[props.task.category] ?? 'var(--ink-faint)') : null,
)

const hasFocusTime = computed(() => !isDone.value && (props.task?.focusSeconds ?? 0) > 0)

const focusBadge = computed(() =>
  hasFocusTime.value ? formatFocusDuration(props.task!.focusSeconds!, t) : '',
)

const hasBottomRow = computed(
  () =>
    !isDone.value &&
    !!(props.task?.category || (props.childTotal && props.childTotal > 0) || hasFocusTime.value),
)

function handleToggleDone() {
  emit('toggleDone', props.entry.taskId, props.task?.status ?? 'open')
}

function handleToggleMit() {
  emit('toggleMit', props.entry.id, props.entry.isMIT)
}

function handleMoveTomorrow() {
  emit('moveTomorrow', props.entry.id, props.entry.taskId)
  actionsOpen.value = false
}
</script>

<template>
  <div class="surface-card cursor-pointer rounded-2xl px-3 py-3 shadow-sm">
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

          <ChildProgress
            v-if="childTotal && childTotal > 0"
            :done="childDone ?? 0"
            :total="childTotal"
          />

          <div
            v-if="hasFocusTime"
            class="flex items-center gap-1"
            :aria-label="t('do.pomodoro.focusBadgeAria', { time: focusBadge })"
          >
            <AppIcon name="timer" :size="12" class="text-ink-faint flex-shrink-0" />
            <span class="text-ink-faint text-xs font-semibold">{{ focusBadge }}</span>
          </div>
        </div>
      </div>

      <!-- MIT toggle: active badge when MIT, faint zap when not -->
      <button
        v-if="!isDone"
        type="button"
        class="flex-shrink-0 cursor-pointer transition-colors"
        :class="{ 'mt-0.5': hasBottomRow }"
        :aria-label="entry.isMIT ? t('today.actions.unmakeMit') : t('today.actions.makeMit')"
        @click="handleToggleMit"
      >
        <AppBadge v-if="entry.isMIT" variant="done">
          <template #icon>
            <AppIcon name="zap" :size="12" />
          </template>
          <span class="hidden sm:inline">{{ t('today.mitLabel') }}</span>
        </AppBadge>
        <AppIcon v-else name="zap" :size="16" class="text-ink-faint hover:text-sage" />
      </button>

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

      <!-- Overflow: MIT toggle + move to tomorrow (active tasks only) -->
      <button
        v-if="!isDone"
        type="button"
        class="text-ink-soft hover:text-ink flex-shrink-0 cursor-pointer transition-colors"
        :class="{ 'mt-0.5': hasBottomRow }"
        :aria-label="t('today.actions.title')"
        @click="actionsOpen = true"
      >
        <AppIcon name="more" :size="20" />
      </button>
    </div>
  </div>

  <AppActionSheet
    :open="actionsOpen"
    :title="t('today.actions.title')"
    @close="actionsOpen = false"
  >
    <div class="flex flex-col gap-1 pt-1">
      <button
        type="button"
        class="font-body text-ink flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors"
        @click="handleMoveTomorrow"
      >
        <AppIcon name="arrowR" :size="16" class="text-ink-soft" />
        {{ t('today.actions.moveTomorrow') }}
      </button>
    </div>
  </AppActionSheet>
</template>
