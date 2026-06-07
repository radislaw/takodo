<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppCheckbox, AppIcon, AppChip, AppInput } from '@/shared/ui'
import {
  useTaskTree,
  useCompleteTask,
  useReopenTask,
  useDeleteTask,
  useResolveResistance,
  useUpdateTask,
  useCreateTask,
} from '@/shared/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })

const id = computed(() => route.params.id as string)
const { data: tree, isPending, status } = useTaskTree(id)
const isError = computed(() => status.value === 'error')

const { mutate: completeTask } = useCompleteTask()
const { mutate: reopenTask } = useReopenTask()
const { mutate: deleteTask } = useDeleteTask()
const { mutate: resolveResistance } = useResolveResistance()
const { mutate: updateTask } = useUpdateTask()
const { mutateAsync: createTask } = useCreateTask()

const editingTitle = ref(false)
const titleValue = ref('')
const editingNote = ref(false)
const noteValue = ref('')
const editingEstimate = ref(false)
const estimateValue = ref('')
const addingSubtask = ref(false)
const subtaskTitle = ref('')

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

function handleSubtaskKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleAddSubtask()
  if (e.key === 'Escape') {
    addingSubtask.value = false
    subtaskTitle.value = ''
  }
}
</script>

<template>
  <div class="surface-app pb-nav min-h-full">
    <header class="surface-card border-line sticky top-0 z-10 border-b shadow-sm">
      <div class="px-5 py-4">
        <button
          type="button"
          class="text-ink-soft hover:text-ink mb-2 flex items-center gap-1 text-sm transition-colors"
          @click="router.push('/tasks')"
        >
          <AppIcon name="chevronR" :size="14" class="rotate-180" />
          {{ t('tasks.detail.back') }}
        </button>
      </div>
    </header>

    <main class="mx-auto max-w-xl px-4 pt-6">
      <div v-if="isPending" class="text-ink-soft font-body py-12 text-center text-sm">
        {{ t('tasks.loading') }}
      </div>

      <div v-else-if="isError" class="text-ink-soft font-body py-12 text-center text-sm">
        {{ t('tasks.detail.notFound') }}
      </div>

      <template v-else-if="tree">
        <div class="surface-card mb-4 rounded-2xl p-4 shadow-sm">
          <div class="mb-3 flex items-start gap-3">
            <AppCheckbox
              :model-value="tree.status === 'done'"
              :label="tree.title"
              @update:model-value="handleToggle"
            />
            <div class="min-w-0 flex-1">
              <input
                v-if="editingTitle"
                v-model="titleValue"
                class="font-body text-ink w-full bg-transparent text-base font-semibold outline-none"
                @blur="commitTitle"
                @keydown.enter="commitTitle"
                @keydown.escape="editingTitle = false"
              />
              <button
                v-else
                type="button"
                class="font-body text-ink w-full text-left text-base font-semibold"
                :class="{ 'line-through opacity-50': tree.status === 'done' }"
                @click="startEditTitle"
              >
                {{ tree.title }}
              </button>
            </div>
          </div>

          <textarea
            v-if="editingNote"
            v-model="noteValue"
            rows="3"
            class="font-body text-ink-soft border-line w-full rounded-lg border bg-transparent p-2 text-sm outline-none"
            :placeholder="t('tasks.detail.notePlaceholder')"
            @blur="commitNote"
          />
          <button
            v-else
            type="button"
            class="font-body text-ink-soft w-full text-left text-sm"
            @click="startEditNote"
          >
            {{ tree.note || t('tasks.detail.notePlaceholder') }}
          </button>

          <div class="mt-3 flex flex-wrap items-center gap-2">
            <input
              v-if="editingEstimate"
              v-model="estimateValue"
              type="number"
              min="1"
              class="border-line w-16 rounded border px-1 text-xs"
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

            <AppChip v-if="!tree.resistanceResolved" @click="resolveResistance(tree.id)">
              {{ t('tasks.resolveResistance') }}
            </AppChip>
            <AppIcon v-else name="check" :size="14" class="text-sage flex-shrink-0" />
          </div>
        </div>

        <section v-if="tree.children.length || true">
          <h2
            class="font-body text-ink-soft mb-2 px-1 text-xs font-semibold tracking-wide uppercase"
          >
            {{ t('tasks.detail.subtasks') }}
          </h2>

          <div
            v-for="child in tree.children"
            :key="child.id"
            class="surface-card mb-2 flex items-center gap-2 rounded-2xl px-3 py-2 shadow-sm"
          >
            <AppCheckbox
              :model-value="child.status === 'done'"
              :label="child.title"
              @update:model-value="
                child.status === 'done' ? reopenTask(child.id) : completeTask(child.id)
              "
            />
            <button
              type="button"
              class="font-body text-ink min-w-0 flex-1 truncate text-left text-sm"
              :class="{ 'line-through opacity-50': child.status === 'done' }"
              @click="router.push(`/tasks/${child.id}`)"
            >
              {{ child.title }}
            </button>
            <button
              type="button"
              class="text-ink-soft hover:text-danger flex-shrink-0 cursor-pointer transition-colors"
              :aria-label="t('tasks.delete')"
              @click="deleteTask(child.id)"
            >
              <AppIcon name="x" :size="14" />
            </button>
          </div>

          <div class="mb-2">
            <div v-if="addingSubtask" class="flex gap-2">
              <AppInput
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
              @click="addingSubtask = true"
            >
              {{ t('tasks.detail.addSubtask') }}
            </button>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>
