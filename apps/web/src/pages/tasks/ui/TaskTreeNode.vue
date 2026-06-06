<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TaskTreeNode from './TaskTreeNode.vue'
import { AppCheckbox, AppIcon, AppChip, AppInput } from '@/shared/ui'
import {
  useCreateTask,
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
  node: Task
  allTasks: Task[]
  depth?: number
}>()

const { t } = useI18n()
const { mutateAsync: createTask } = useCreateTask()
const { mutate: completeTask } = useCompleteTask()
const { mutate: reopenTask } = useReopenTask()
const { mutate: deleteTask } = useDeleteTask()
const { mutate: resolveResistance } = useResolveResistance()
const { mutate: updateTask } = useUpdateTask()

const children = computed(() => props.allTasks.filter((t) => t.parentId === props.node.id))
const expanded = ref(true)
const addingStep = ref(false)
const stepTitle = ref('')
const editingEstimate = ref(false)
const estimateValue = ref(String(props.node.estimateMinutes ?? ''))

function handleToggle() {
  if (props.node.status === 'done') reopenTask(props.node.id)
  else completeTask(props.node.id)
}

async function handleAddStep() {
  const title = stepTitle.value.trim()
  if (!title) return
  await createTask({ title, parentId: props.node.id })
  stepTitle.value = ''
  addingStep.value = false
}

function handleStepKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleAddStep()
  if (e.key === 'Escape') {
    addingStep.value = false
    stepTitle.value = ''
  }
}

function handleEstimateBlur() {
  const val = parseInt(estimateValue.value)
  if (!isNaN(val) && val > 0) updateTask({ id: props.node.id, estimateMinutes: val })
  editingEstimate.value = false
}
</script>

<template>
  <div :style="{ paddingLeft: `${(depth ?? 0) * 16}px` }">
    <div class="surface-card mb-2 flex items-center gap-2 rounded-2xl px-3 py-2 shadow-sm">
      <button
        v-if="children.length"
        type="button"
        class="text-ink-faint hover:text-ink flex-shrink-0 cursor-pointer"
        @click="expanded = !expanded"
      >
        <AppIcon name="chevronR" :size="14" :class="expanded ? 'rotate-90' : ''" />
      </button>
      <span v-else class="w-[14px] flex-shrink-0" />

      <AppCheckbox
        :model-value="node.status === 'done'"
        :label="node.title"
        @update:model-value="handleToggle"
      />

      <span
        class="font-body text-ink min-w-0 flex-1 truncate text-sm"
        :class="{ 'line-through opacity-50': node.status === 'done' }"
      >
        {{ node.title }}
      </span>

      <input
        v-if="editingEstimate"
        v-model="estimateValue"
        type="number"
        min="1"
        class="border-line w-12 rounded border px-1 text-xs"
        @blur="handleEstimateBlur"
        @keydown.enter="handleEstimateBlur"
      />
      <button
        v-else
        type="button"
        class="text-ink-faint hover:text-ink flex-shrink-0 cursor-pointer text-xs"
        :aria-label="t('tasks.estimateLabel')"
        @click="editingEstimate = true"
      >
        {{
          node.estimateMinutes
            ? `${node.estimateMinutes} ${t('tasks.estimateLabel')}`
            : t('tasks.estimateLabel')
        }}
      </button>

      <AppChip v-if="!node.resistanceResolved" @click="resolveResistance(node.id)">
        {{ t('tasks.resolveResistance') }}
      </AppChip>
      <AppIcon v-else name="check" :size="14" class="text-sage flex-shrink-0" />

      <button
        type="button"
        class="text-ink-soft hover:text-danger flex-shrink-0 cursor-pointer transition-colors"
        :aria-label="t('tasks.delete')"
        @click="deleteTask(node.id)"
      >
        <AppIcon name="x" :size="14" />
      </button>
    </div>

    <template v-if="expanded">
      <TaskTreeNode
        v-for="child in children"
        :key="child.id"
        :node="child"
        :all-tasks="allTasks"
        :depth="(depth ?? 0) + 1"
      />

      <div :style="{ paddingLeft: `${((depth ?? 0) + 1) * 16}px` }" class="mb-2">
        <div v-if="addingStep" class="flex gap-2">
          <AppInput
            v-model="stepTitle"
            :placeholder="t('tasks.addPlaceholder')"
            class="flex-1"
            @keydown="handleStepKeydown"
          />
        </div>
        <button
          v-else
          type="button"
          class="text-ink-faint hover:text-sage cursor-pointer text-xs transition-colors"
          @click="addingStep = true"
        >
          {{ t('tasks.addStep') }}
        </button>
      </div>
    </template>
  </div>
</template>
