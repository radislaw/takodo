<script setup lang="ts">
import { ref, computed, nextTick, type ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppCheckbox, AppIcon, AppInput, AppProgressRing, AppActionSheet } from '@/shared/ui'
import { formatFocusDuration } from '@/shared/lib/formatFocus'
import {
  useTaskTree,
  useTasks,
  useCompleteTask,
  useReopenTask,
  useDeleteTask,
  useResolveResistance,
  useUpdateTask,
  useCreateTask,
} from '@/shared/api'
import TaskCard from './TaskCard.vue'
import TaskListPane from './TaskListPane.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })

const id = computed(() => route.params.id as string)
const { data: tree, isPending, status } = useTaskTree(id)
const isError = computed(() => status.value === 'error')

const { data: taskList } = useTasks()

const { mutate: completeTask } = useCompleteTask()
const { mutate: reopenTask } = useReopenTask()
const { mutate: deleteTask } = useDeleteTask()
const { mutate: resolveResistance } = useResolveResistance()
const { mutate: updateTask } = useUpdateTask()
const { mutateAsync: createTask } = useCreateTask()

// Breadcrumbs: walk up parentId chain from the current task
const ancestors = computed(() => {
  if (!tree.value) return []
  const taskMap = new Map((taskList.value ?? []).map((t) => [t.id, t]))
  const chain: { id: string; title: string }[] = []
  let parentId: string | null = tree.value.parentId
  while (parentId) {
    const parent = taskMap.get(parentId)
    if (!parent) break
    chain.unshift({ id: parent.id, title: parent.title })
    parentId = parent.parentId
  }
  return chain
})

// Progress for direct children
const childDoneCount = computed(
  () => tree.value?.children.filter((c) => c.status === 'done').length ?? 0,
)
const childTotal = computed(() => tree.value?.children.length ?? 0)

const editingTitle = ref(false)
const titleValue = ref('')
const editingNote = ref(false)
const noteValue = ref('')
const editingEstimate = ref(false)
const estimateValue = ref('')
const addingSubtask = ref(false)
const subtaskTitle = ref('')
const subtaskInputRef = ref<{ focus: () => void } | null>(null)
const confirmDeleteOpen = ref(false)

function handleToggle() {
  if (!tree.value) return
  if (tree.value.status === 'done') reopenTask(tree.value.id)
  else completeTask(tree.value.id)
}

function startEditTitle() {
  titleValue.value = tree.value?.title ?? ''
  editingTitle.value = true
}

function commitTitle() {
  const title = titleValue.value.trim()
  if (title && title !== tree.value?.title) updateTask({ id: id.value, title })
  editingTitle.value = false
}

function startEditNote() {
  noteValue.value = tree.value?.note ?? ''
  editingNote.value = true
}

function commitNote() {
  const note = noteValue.value.trim()
  if (note !== (tree.value?.note ?? '')) updateTask({ id: id.value, note })
  editingNote.value = false
}

function commitEstimate() {
  const val = parseInt(estimateValue.value)
  if (!isNaN(val) && val > 0) updateTask({ id: id.value, estimateMinutes: val })
  editingEstimate.value = false
}

async function handleAddSubtask() {
  const title = subtaskTitle.value.trim()
  if (!title) return
  await createTask({ title, parentId: id.value })
  subtaskTitle.value = ''
  addingSubtask.value = false
}

async function startAddingSubtask() {
  addingSubtask.value = true
  await nextTick()
  subtaskInputRef.value?.focus()
}

function handleSubtaskKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleAddSubtask()
  if (e.key === 'Escape') {
    addingSubtask.value = false
    subtaskTitle.value = ''
  }
}

const MAX_TOMATOES = 5

const focusStatsText: ComputedRef<string> = computed(() => {
  if (!tree.value) return ''
  return t('tasks.detail.focusStats', { time: formatFocusDuration(tree.value.focusSeconds, t) })
})

const visibleTomatoes: ComputedRef<number> = computed(() =>
  Math.min(tree.value?.pomodoros ?? 0, MAX_TOMATOES),
)
const tomatoOverflowText: ComputedRef<string> = computed(() => {
  const overflow = Math.max((tree.value?.pomodoros ?? 0) - MAX_TOMATOES, 0)
  return overflow > 0 ? `+${overflow}` : ''
})

function handleDeleteConfirmed() {
  deleteTask(id.value)
  confirmDeleteOpen.value = false
  router.push('/tasks')
}
</script>

<template>
  <div
    class="surface-app pb-nav min-h-full lg:flex lg:h-full lg:min-h-0 lg:overflow-hidden lg:pb-0"
  >
    <!-- List pane (desktop master-detail) -->
    <div
      class="lg:border-line hidden lg:block lg:h-full lg:w-[380px] lg:flex-shrink-0 lg:overflow-y-auto lg:border-r"
    >
      <header class="surface-card border-line sticky top-0 z-10 border-b shadow-sm">
        <div class="px-5 py-4">
          <h1 class="font-display text-ink text-xl leading-tight font-extrabold">
            {{ t('tasks.title') }}
          </h1>
        </div>
      </header>
      <TaskListPane :selected-id="id" class="px-4 pt-6" />
    </div>

    <!-- Detail pane -->
    <div class="lg:h-full lg:min-w-0 lg:flex-1 lg:overflow-y-auto">
      <header class="surface-card border-line sticky top-0 z-10 border-b shadow-sm">
        <div class="px-5 py-3">
          <!-- Breadcrumbs -->
          <nav class="flex flex-wrap items-center gap-1 text-sm" aria-label="breadcrumb">
            <button
              type="button"
              class="text-ink-soft hover:text-ink transition-colors"
              @click="router.push('/tasks')"
            >
              {{ t('tasks.detail.breadcrumbRoot') }}
            </button>
            <template v-for="ancestor in ancestors" :key="ancestor.id">
              <AppIcon name="chevronR" :size="12" class="text-ink-faint flex-shrink-0" />
              <button
                type="button"
                class="text-ink-soft hover:text-ink max-w-[120px] truncate transition-colors"
                @click="router.push(`/tasks/${ancestor.id}`)"
              >
                {{ ancestor.title }}
              </button>
            </template>
            <template v-if="tree">
              <AppIcon name="chevronR" :size="12" class="text-ink-faint flex-shrink-0" />
              <span class="text-ink max-w-[140px] truncate font-semibold">{{ tree.title }}</span>
            </template>
          </nav>
        </div>
      </header>

      <main class="mx-auto max-w-xl px-4 pt-5">
        <div v-if="isPending" class="text-ink-soft font-body py-12 text-center text-sm">
          {{ t('tasks.loading') }}
        </div>

        <div v-else-if="isError" class="text-ink-soft font-body py-12 text-center text-sm">
          {{ t('tasks.detail.notFound') }}
        </div>

        <template v-else-if="tree">
          <!-- Hero card -->
          <div class="surface-card mb-4 rounded-2xl p-5 shadow-sm">
            <div class="mb-4 flex items-start gap-4">
              <div class="min-w-0 flex-1">
                <input
                  v-if="editingTitle"
                  v-model="titleValue"
                  class="font-display text-ink w-full bg-transparent text-2xl leading-tight font-extrabold outline-none"
                  @blur="commitTitle"
                  @keydown.enter="commitTitle"
                  @keydown.escape="editingTitle = false"
                />
                <button
                  v-else
                  type="button"
                  class="font-display text-ink break-anywhere w-full text-left text-2xl leading-tight font-extrabold"
                  :class="{ 'line-through opacity-50': tree.status === 'done' }"
                  @click="startEditTitle"
                >
                  {{ tree.title }}
                </button>
              </div>
              <AppProgressRing
                v-if="childTotal > 0"
                :done="childDoneCount"
                :total="childTotal"
                class="!h-14 !w-14 flex-shrink-0"
              />
            </div>

            <!-- Meta row -->
            <div class="flex flex-wrap items-center gap-3">
              <AppCheckbox
                :model-value="tree.status === 'done'"
                :size="22"
                :aria-label="tree.title"
                @update:model-value="handleToggle"
              />

              <div class="flex items-center gap-1">
                <input
                  v-if="editingEstimate"
                  v-model="estimateValue"
                  type="number"
                  min="1"
                  class="border-line w-16 rounded-lg border px-2 py-1 text-sm"
                  @blur="commitEstimate"
                  @keydown.enter="commitEstimate"
                />
                <button
                  v-else
                  type="button"
                  class="text-ink-faint hover:text-ink cursor-pointer text-xs transition-colors"
                  @click="
                    () => {
                      estimateValue = String(tree!.estimateMinutes ?? '')
                      editingEstimate = true
                    }
                  "
                >
                  {{
                    tree.estimateMinutes
                      ? `${tree.estimateMinutes} ${t('tasks.estimateLabel')}`
                      : t('tasks.estimateLabel')
                  }}
                </button>
              </div>

              <button
                v-if="!tree.resistanceResolved"
                type="button"
                class="font-body text-apricot-deep border-apricot-tint bg-apricot-tint inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-xs font-semibold transition-colors"
                @click="resolveResistance(tree.id)"
              >
                <AppIcon name="flame" :size="12" class="text-apricot" />
                {{ t('tasks.resolveResistance') }}
              </button>
              <AppIcon v-else name="check" :size="14" class="text-sage flex-shrink-0" />

              <button
                type="button"
                class="text-ink-faint hover:text-softrose ml-auto transition-colors"
                :aria-label="t('tasks.actions.delete')"
                @click="confirmDeleteOpen = true"
              >
                <AppIcon name="x" :size="16" />
              </button>
            </div>

            <!-- Focus stats -->
            <div
              v-if="tree.focusSeconds > 0 || tree.pomodoros > 0"
              class="border-line-card mt-3 flex items-center gap-1.5 border-t pt-3"
            >
              <AppIcon name="timer" :size="14" class="text-ink-faint flex-shrink-0" />
              <span class="text-ink-faint text-xs font-semibold">{{ focusStatsText }}</span>
              <span
                v-if="tree.pomodoros > 0"
                role="img"
                :aria-label="t('do.pomodoro.count', tree.pomodoros)"
                class="text-apricot-deep ml-1 flex items-center gap-0.5 text-xs font-semibold"
              >
                <AppIcon
                  v-for="i in visibleTomatoes"
                  :key="i"
                  name="tomato"
                  :size="13"
                  aria-hidden="true"
                />
                <span v-if="tomatoOverflowText" aria-hidden="true">{{ tomatoOverflowText }}</span>
              </span>
            </div>

            <!-- Note -->
            <div class="border-line-card mt-4 border-t pt-3">
              <p class="text-ink-faint mb-1 text-xs font-semibold tracking-wide uppercase">
                {{ t('tasks.detail.notePlaceholder') }}
              </p>
              <textarea
                v-if="editingNote"
                v-model="noteValue"
                rows="3"
                class="font-body text-ink border-line w-full rounded-lg border bg-transparent p-2 text-sm outline-none"
                @blur="commitNote"
              />
              <button
                v-else
                type="button"
                class="font-body text-ink-soft w-full text-left text-sm"
                @click="startEditNote"
              >
                {{ tree.note || '—' }}
              </button>
            </div>
          </div>

          <!-- Subtasks -->
          <section>
            <h2
              class="font-body text-ink-soft mb-2 px-1 text-xs font-semibold tracking-wide uppercase"
            >
              {{ t('tasks.detail.subtasks') }}
            </h2>

            <TaskCard v-for="child in tree.children" :key="child.id" :task="child" />

            <div class="mb-2">
              <div v-if="addingSubtask" class="flex gap-2">
                <AppInput
                  ref="subtaskInputRef"
                  v-model="subtaskTitle"
                  :placeholder="t('tasks.detail.addSubtaskPlaceholder')"
                  class="flex-1"
                  @keydown="handleSubtaskKeydown"
                />
              </div>
              <button
                v-else
                type="button"
                class="text-ink-faint hover:text-sage cursor-pointer text-xs transition-colors"
                @click="startAddingSubtask"
              >
                {{ t('tasks.detail.addSubtask') }}
              </button>
            </div>
          </section>
        </template>
      </main>
    </div>

    <!-- Confirm delete task -->
    <AppActionSheet
      :open="confirmDeleteOpen"
      :title="t('tasks.confirmDelete.title')"
      @close="confirmDeleteOpen = false"
    >
      <div class="flex flex-col gap-2 pt-2">
        <button
          type="button"
          class="font-body text-softrose bg-softrose-tint flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-bold transition-colors"
          @click="handleDeleteConfirmed"
        >
          {{ t('tasks.confirmDelete.confirm') }}
        </button>
        <button
          type="button"
          class="font-body text-ink-soft flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-semibold transition-colors"
          @click="confirmDeleteOpen = false"
        >
          {{ t('tasks.confirmDelete.cancel') }}
        </button>
      </div>
    </AppActionSheet>
  </div>
</template>
