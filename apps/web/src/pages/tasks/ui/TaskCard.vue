<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppCheckbox, AppIcon, AppActionSheet, ChildProgress } from '@/shared/ui'
import {
  useCompleteTask,
  useReopenTask,
  useDeleteTask,
  useResolveResistance,
  useUpdateTask,
  useAddDailyEntry,
} from '@/shared/api'
import { useReward } from '@/shared/lib/useReward'
import { useUndoDelete } from '@/shared/lib/useUndoDelete'
import { useSuccessToast } from '@/shared/lib/useSuccessToast'

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
  expanded?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  toggleExpand: []
}>()

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const { mutate: completeTask } = useCompleteTask()
const { mutate: reopenTask } = useReopenTask()
const { mutate: deleteTask } = useDeleteTask()
const { mutate: resolveResistance } = useResolveResistance()
const { mutate: updateTask } = useUpdateTask()

const { celebrate } = useReward()
const { scheduleDelete } = useUndoDelete()
const { mutateAsync: addToTodayAsync } = useAddDailyEntry()
const { showSuccess } = useSuccessToast()

const actionsOpen = ref(false)
const confirmOpen = ref(false)
const editingEstimate = ref(false)
const estimateValue = ref('')

function handleToggle() {
  if (props.task.status === 'done') reopenTask(props.task.id)
  else completeTask(props.task.id)
}

function handleResolveBadge() {
  resolveResistance(props.task.id)
  celebrate()
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

function openConfirmDelete() {
  actionsOpen.value = false
  confirmOpen.value = true
}

function handleDelete() {
  confirmOpen.value = false
  scheduleDelete(() => deleteTask(props.task.id))
}

async function handleAddToToday() {
  actionsOpen.value = false
  try {
    await addToTodayAsync(props.task.id)
    showSuccess('success.addedToToday')
  } catch {
    // error toast shown by mutation
  }
}
</script>

<template>
  <div
    class="mb-2 flex w-full items-center gap-3 rounded-2xl border-[1.5px] px-3 py-2.5 shadow-sm"
    :class="selected ? 'bg-sage-tint border-sage' : 'surface-card border-transparent'"
  >
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

    <button
      v-if="childTotal && childTotal > 0"
      type="button"
      class="text-ink-soft hover:text-ink flex flex-shrink-0 cursor-pointer items-center gap-0.5 transition-colors"
      :aria-expanded="expanded"
      :aria-label="t('tasks.toggleExpand')"
      @click="emit('toggleExpand')"
    >
      <ChildProgress :done="childDone ?? 0" :total="childTotal" />
      <AppIcon
        name="chevronR"
        :size="12"
        class="inline-block transition-transform"
        :class="{ 'rotate-90': expanded }"
      />
    </button>

    <button
      v-if="!task.resistanceResolved && task.status !== 'done'"
      type="button"
      class="text-apricot hover:text-apricot-deep flex-shrink-0 cursor-pointer transition-colors"
      :aria-label="t('tasks.resistanceBadgeLabel')"
      @click="handleResolveBadge"
    >
      <AppIcon name="flame" :size="18" />
    </button>

    <button
      type="button"
      class="text-sage hover:text-sage-deep flex-shrink-0 cursor-pointer transition-colors"
      :aria-label="t('tasks.actions.addToToday')"
      @click="handleAddToToday"
    >
      <AppIcon name="plus" :size="18" />
    </button>

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
