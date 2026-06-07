<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppCheckbox, AppIcon, AppActionSheet } from '@/shared/ui'
import {
  useCompleteTask,
  useReopenTask,
  useDeleteTask,
  useResolveResistance,
  useUpdateTask,
} from '@/shared/api'

interface Task {
  id: string
  parentId: string | null
  title: string
  status: 'open' | 'done'
  resistanceResolved: boolean
  estimateMinutes?: number
  normalizedTitle: string
}

const props = defineProps<{
  task: Task
  childDone?: number
  childTotal?: number
}>()

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const { mutate: completeTask } = useCompleteTask()
const { mutate: reopenTask } = useReopenTask()
const { mutate: deleteTask } = useDeleteTask()
const { mutate: resolveResistance } = useResolveResistance()
const { mutate: updateTask } = useUpdateTask()

const actionsOpen = ref(false)
const confirmOpen = ref(false)
const editingEstimate = ref(false)
const estimateValue = ref('')

function handleToggle() {
  if (props.task.status === 'done') reopenTask(props.task.id)
  else completeTask(props.task.id)
}

function openActions() {
  estimateValue.value = String(props.task.estimateMinutes ?? '')
  actionsOpen.value = true
}

function handleEstimateCommit() {
  const val = parseInt(estimateValue.value)
  if (!isNaN(val) && val > 0) updateTask({ id: props.task.id, estimateMinutes: val })
  editingEstimate.value = false
  actionsOpen.value = false
}

function handleResolve() {
  resolveResistance(props.task.id)
  actionsOpen.value = false
}

function openConfirmDelete() {
  actionsOpen.value = false
  confirmOpen.value = true
}

function handleDelete() {
  deleteTask(props.task.id)
  confirmOpen.value = false
}
</script>

<template>
  <div class="surface-card mb-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 shadow-sm">
    <AppCheckbox
      :model-value="task.status === 'done'"
      :aria-label="task.title"
      @update:model-value="handleToggle"
    />

    <button
      type="button"
      class="font-body text-ink min-w-0 flex-1 truncate text-left text-sm font-semibold"
      :class="{ 'line-through opacity-50': task.status === 'done' }"
      @click="router.push(`/tasks/${task.id}`)"
    >
      {{ task.title }}
    </button>

    <span
      v-if="childTotal && childTotal > 0"
      class="text-ink-soft flex-shrink-0 text-xs font-semibold"
    >
      {{ t('tasks.progress', { done: childDone ?? 0, total: childTotal }) }}
    </span>

    <button
      type="button"
      class="text-ink-soft hover:text-ink flex-shrink-0 cursor-pointer transition-colors"
      :aria-label="t('tasks.actions.title')"
      @click="openActions"
    >
      <AppIcon name="more" :size="20" />
    </button>
  </div>

  <AppActionSheet
    :open="actionsOpen"
    :title="t('tasks.actions.title')"
    @close="actionsOpen = false"
  >
    <div class="flex flex-col gap-1 pt-1">
      <div v-if="editingEstimate" class="flex items-center gap-2 px-1 py-2">
        <input
          v-model="estimateValue"
          type="number"
          min="1"
          class="border-line w-20 rounded-lg border px-2 py-1 text-sm"
          @keydown.enter="handleEstimateCommit"
          @keydown.escape="editingEstimate = false"
        />
        <button
          type="button"
          class="text-sage font-body text-sm font-semibold"
          @click="handleEstimateCommit"
        >
          {{ t('tasks.actions.estimateOk') }}
        </button>
      </div>
      <button
        v-else
        type="button"
        class="font-body text-ink flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors"
        @click="editingEstimate = true"
      >
        <AppIcon name="zap" :size="16" class="text-ink-soft" />
        {{
          task.estimateMinutes
            ? `${t('tasks.actions.estimate')}: ${task.estimateMinutes} ${t('tasks.estimateLabel')}`
            : t('tasks.actions.estimate')
        }}
      </button>

      <button
        v-if="!task.resistanceResolved"
        type="button"
        class="font-body text-ink flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors"
        @click="handleResolve"
      >
        <AppIcon name="flame" :size="16" class="text-apricot" />
        {{ t('tasks.actions.resolve') }}
      </button>

      <div class="border-line-card my-1 border-t" />

      <button
        type="button"
        class="font-body text-softrose flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors"
        @click="openConfirmDelete"
      >
        <AppIcon name="x" :size="16" />
        {{ t('tasks.actions.delete') }}
      </button>
    </div>
  </AppActionSheet>

  <AppActionSheet
    :open="confirmOpen"
    :title="t('tasks.confirmDelete.title')"
    @close="confirmOpen = false"
  >
    <div class="flex flex-col gap-2 pt-2">
      <button
        type="button"
        class="font-body text-softrose bg-softrose-tint flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-bold transition-colors"
        @click="handleDelete"
      >
        {{ t('tasks.confirmDelete.confirm') }}
      </button>
      <button
        type="button"
        class="font-body text-ink-soft flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-semibold transition-colors"
        @click="confirmOpen = false"
      >
        {{ t('tasks.confirmDelete.cancel') }}
      </button>
    </div>
  </AppActionSheet>
</template>
