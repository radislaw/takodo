<script setup lang="ts">
import { ref, computed, nextTick, type ComponentPublicInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppButton, PomodoroTimer, AppCheckbox, AppInput } from '@/shared/ui'
import { CAT_COLORS } from '@/shared/lib/categories'
import {
  useDailyToday,
  useTasks,
  useCompleteTask,
  useReopenTask,
  useTaskTree,
  useCreateTask,
  useDeleteTask,
} from '@/shared/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })

const startId = typeof route.query.task === 'string' ? route.query.task : undefined

const { data: daily, isPending } = useDailyToday()
const { data: taskList } = useTasks()
const { mutateAsync: completeTaskAsync } = useCompleteTask()
const { mutate: reopenTask } = useReopenTask()
const { mutate: completeSubtask } = useCompleteTask()
const { mutateAsync: createSubtask } = useCreateTask()
const { mutate: deleteSubtask } = useDeleteTask()

type PomodoroTimerExposed = ComponentPublicInstance & {
  flush: () => void
  flushAndReset: () => void
}
const pomodoroTimerRef = ref<PomodoroTimerExposed | null>(null)

const addingSubtask = ref(false)
const newSubtaskTitle = ref('')
const subtaskInputRef = ref<{ focus: () => void } | null>(null)

const skippedIds = ref<string[]>([])
const completingIds = ref<string[]>([])

const taskMap = computed(() => {
  const map = new Map<
    string,
    {
      id: string
      title: string
      status: string
      category?: string | null
      focusSeconds: number
      pomodoros: number
    }
  >()
  for (const task of taskList.value ?? []) map.set(task.id, task)
  return map
})

const queue = computed(() => {
  const entries = daily.value?.entries ?? []
  const active = entries
    .filter(
      (e) =>
        taskMap.value.get(e.taskId)?.status !== 'done' && !completingIds.value.includes(e.taskId),
    )
    .sort((a, b) => Number(b.isMIT) - Number(a.isMIT) || a.order - b.order)
  const notSkipped = active.filter((e) => !skippedIds.value.includes(e.taskId))
  const fresh = startId
    ? [
        ...notSkipped.filter((e) => e.taskId === startId),
        ...notSkipped.filter((e) => e.taskId !== startId),
      ]
    : notSkipped
  const skipped = skippedIds.value
    .map((id) => active.find((e) => e.taskId === id))
    .filter((e): e is NonNullable<typeof e> => e !== undefined)
  return [...fresh, ...skipped]
})

const current = computed(() => queue.value[0])
const currentTask = computed(() =>
  current.value ? taskMap.value.get(current.value.taskId) : undefined,
)
const catColor = computed(() => {
  const cat = currentTask.value?.category
  return cat ? CAT_COLORS[cat] : undefined
})

const currentTaskId = computed(() => current.value?.taskId || '')
const { data: taskTree } = useTaskTree(currentTaskId)

const subtasks = computed(() => taskTree.value?.children ?? [])

function toggleSubtask(id: string, status: string) {
  if (status === 'done') reopenTask(id)
  else completeSubtask(id)
}

async function startAddingSubtask() {
  addingSubtask.value = true
  await nextTick()
  subtaskInputRef.value?.focus()
}

async function handleAddSubtask() {
  const title = newSubtaskTitle.value.trim()
  if (!title) {
    addingSubtask.value = false
    return
  }
  await createSubtask({ title, parentId: currentTaskId.value })
  newSubtaskTitle.value = ''
  addingSubtask.value = false
}

function handleSubtaskKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleAddSubtask()
  if (e.key === 'Escape') {
    addingSubtask.value = false
    newSubtaskTitle.value = ''
  }
}

async function handleDone() {
  const id = current.value?.taskId
  if (!id) return
  pomodoroTimerRef.value?.flush()
  completingIds.value = [...completingIds.value, id]
  try {
    await completeTaskAsync(id)
  } catch {
    completingIds.value = completingIds.value.filter((x) => x !== id)
  }
}

function handleSkip() {
  const id = current.value?.taskId
  if (!id) return
  skippedIds.value = [...skippedIds.value.filter((x) => x !== id), id]
}

function goBack() {
  pomodoroTimerRef.value?.flush()
  router.push('/today')
}
</script>

<template>
  <div class="surface-app flex min-h-full flex-col">
    <!-- Header -->
    <header
      class="mx-auto flex w-full max-w-4xl items-center justify-between px-5 pb-2"
      style="padding-top: calc(1rem + env(safe-area-inset-top))"
    >
      <p v-if="queue.length > 0" class="font-body text-ink-soft text-sm font-semibold">
        {{ t('do.left', queue.length) }}
      </p>
      <span v-else />
      <button
        type="button"
        class="text-ink-soft hover:text-ink flex h-11 w-11 cursor-pointer items-center justify-center"
        :aria-label="t('do.close')"
        @click="goBack"
      >
        <AppIcon name="x" :size="24" />
      </button>
    </header>

    <!-- Loading -->
    <div v-if="isPending" class="text-ink-soft font-body flex-1 py-12 text-center text-sm">
      {{ t('do.loading') }}
    </div>

    <!-- Current task -->
    <main v-else-if="current" class="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6">
      <div class="flex flex-1 flex-col gap-8 md:flex-row md:items-center">
        <!-- Focus area -->
        <div class="flex flex-1 flex-col items-center justify-center text-center">
          <p class="font-body text-ink-soft mb-3 text-sm">{{ t('do.subtitle') }}</p>
          <div
            v-if="current.isMIT"
            class="bg-sage/10 mb-4 inline-flex items-center gap-1 rounded-full px-3 py-1.5"
          >
            <AppIcon name="zap" :size="14" class="text-sage-deep" />
            <span class="text-sage-deep text-xs font-bold">{{ t('today.mitLabel') }}</span>
          </div>
          <h1 class="font-display text-ink text-3xl leading-tight font-extrabold break-words">
            <span
              v-if="catColor"
              class="mr-2 inline-block h-3 w-3 rounded-full align-middle"
              :style="{ background: catColor }"
            />{{ currentTask?.title }}
          </h1>

          <PomodoroTimer
            v-if="currentTask"
            :key="currentTask.id"
            ref="pomodoroTimerRef"
            :task-id="currentTask.id"
            :focus-seconds="currentTask.focusSeconds ?? 0"
            :pomodoros="currentTask.pomodoros ?? 0"
            class="mt-8"
          />
        </div>

        <!-- Subtasks panel -->
        <div v-if="subtasks.length || currentTaskId" class="md:w-72 md:self-center">
          <p class="font-body text-ink-soft mb-3 text-xs font-semibold tracking-wide uppercase">
            {{ t('do.subtasks') }}
          </p>
          <div class="space-y-2">
            <div
              v-for="child in subtasks"
              :key="child.id"
              class="surface-card group flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] border-transparent px-3 py-2.5 shadow-sm transition-colors"
              :class="{ 'opacity-60': child.status === 'done' }"
              @click="toggleSubtask(child.id, child.status)"
            >
              <AppCheckbox
                class="pointer-events-none flex-shrink-0"
                :model-value="child.status === 'done'"
                :aria-label="child.title"
              />
              <span
                class="font-body text-ink min-w-0 flex-1 truncate text-sm font-semibold"
                :class="{ 'line-through opacity-50': child.status === 'done' }"
              >
                {{ child.title }}
              </span>
              <button
                type="button"
                class="text-ink-faint hover:text-softrose flex-shrink-0 opacity-0 transition-colors group-hover:opacity-100"
                :aria-label="t('do.deleteSubtask')"
                @click.stop="deleteSubtask(child.id)"
              >
                <AppIcon name="x" :size="14" />
              </button>
            </div>

            <!-- Add subtask -->
            <div v-if="addingSubtask" class="px-1">
              <AppInput
                ref="subtaskInputRef"
                v-model="newSubtaskTitle"
                :placeholder="t('do.addSubtaskPlaceholder')"
                @keydown="handleSubtaskKeydown"
                @blur="handleAddSubtask"
              />
            </div>
            <button
              v-else
              type="button"
              class="text-ink-faint hover:text-sage font-body w-full cursor-pointer px-1 py-1 text-left text-xs font-semibold transition-colors"
              @click="startAddingSubtask"
            >
              {{ t('do.addSubtask') }}
            </button>
          </div>
        </div>
      </div>

      <div
        class="mt-auto flex flex-col gap-3 pt-8"
        style="padding-bottom: calc(2rem + env(safe-area-inset-bottom))"
      >
        <AppButton variant="primary" class="w-full !py-4 !text-base" @click="handleDone">
          <AppIcon name="check" :size="20" />
          {{ t('do.doneButton') }}
        </AppButton>
        <AppButton v-if="queue.length > 1" variant="ghost" class="w-full" @click="handleSkip">
          {{ t('do.notNow') }}
          <AppIcon name="arrowR" :size="16" />
        </AppButton>
      </div>
    </main>

    <!-- All done -->
    <main v-else class="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <AppIcon name="sparkles" :size="40" class="text-apricot-deep mb-4" />
      <h1 class="font-display text-ink mb-6 text-2xl font-extrabold">{{ t('do.allDone') }}</h1>
      <AppButton variant="secondary" @click="goBack">
        {{ t('do.backToToday') }}
      </AppButton>
    </main>
  </div>
</template>
