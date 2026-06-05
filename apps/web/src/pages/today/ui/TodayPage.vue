<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AppButton,
  AppInput,
  AppCheckbox,
  AppBadge,
  AppIcon,
  AppProgressRing,
  AppToast,
} from '@/shared/ui'
import {
  useDailyToday,
  useAddDailyEntry,
  useUpdateDailyEntry,
  useRemoveDailyEntry,
  useTasks,
  useCreateTask,
  useCompleteTask,
  useReopenTask,
} from '@/shared/api'

const { t } = useI18n()

const { data: daily, isPending } = useDailyToday()
const { data: taskList } = useTasks()

const { mutateAsync: createTaskAsync } = useCreateTask()
const { mutateAsync: addEntryAsync } = useAddDailyEntry()
const { mutate: completeTask } = useCompleteTask()
const { mutate: reopenTask } = useReopenTask()
const { mutateAsync: updateEntryAsync } = useUpdateDailyEntry()
const { mutate: removeEntry } = useRemoveDailyEntry()

const newTitle = ref('')
const isAdding = ref(false)
const showMitLimitToast = ref(false)
let mitToastTimer: ReturnType<typeof setTimeout> | null = null

const taskMap = computed(() => {
  const map = new Map<string, { id: string; title: string; status: string }>()
  for (const t of taskList.value ?? []) map.set(t.id, t)
  return map
})

const entries = computed(() => daily.value?.entries ?? [])

const doneCount = computed(
  () => entries.value.filter((e) => taskMap.value.get(e.taskId)?.status === 'done').length,
)

async function handleAdd() {
  const title = newTitle.value.trim()
  if (!title) return
  isAdding.value = true
  try {
    const task = await createTaskAsync({ title })
    await addEntryAsync(task.id)
    newTitle.value = ''
  } finally {
    isAdding.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleAdd()
}

function handleToggleDone(taskId: string, currentStatus: string) {
  if (currentStatus === 'done') reopenTask(taskId)
  else completeTask(taskId)
}

async function handleToggleMIT(entryId: string, currentMIT: boolean) {
  try {
    await updateEntryAsync({ entryId, isMIT: !currentMIT })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'mit_limit') {
      showMitLimitToast.value = true
      if (mitToastTimer) clearTimeout(mitToastTimer)
      mitToastTimer = setTimeout(() => {
        showMitLimitToast.value = false
      }, 3000)
    }
  }
}
</script>

<template>
  <div class="surface-app min-h-dvh pb-8">
    <!-- Header -->
    <header class="surface-card border-line sticky top-0 z-10 border-b shadow-sm">
      <div class="flex items-center justify-between px-5 py-4">
        <h1 class="font-display text-ink text-xl leading-tight font-extrabold">
          {{ t('today.title') }}
        </h1>
        <AppProgressRing
          :done="doneCount"
          :total="entries.length || 1"
          :aria-label="t('today.progressAria', { done: doneCount, total: entries.length })"
        />
      </div>
    </header>

    <!-- MIT limit toast -->
    <Transition name="fade">
      <div v-if="showMitLimitToast" class="fixed top-20 right-4 left-4 z-50 mx-auto max-w-sm">
        <AppToast variant="gentle">
          <template #icon>
            <AppIcon name="bell" :size="15" />
          </template>
          {{ t('today.mitLimitToast') }}
        </AppToast>
      </div>
    </Transition>

    <main class="mx-auto max-w-xl px-4 pt-6">
      <!-- Add form -->
      <div class="surface-card mb-5 flex gap-2 rounded-2xl p-4 shadow-sm">
        <AppInput
          v-model="newTitle"
          :placeholder="t('today.addPlaceholder')"
          class="flex-1"
          @keydown="handleKeydown"
        />
        <AppButton variant="primary" :disabled="isAdding || !newTitle.trim()" @click="handleAdd">
          <AppIcon v-if="isAdding" name="sparkles" :size="16" color="#fff" />
          <AppIcon v-else name="plus" :size="16" color="#fff" :stroke-width="2.4" />
          {{ t('today.addButton') }}
        </AppButton>
      </div>

      <!-- Loading -->
      <div v-if="isPending" class="text-ink-soft font-body py-12 text-center text-sm">
        {{ t('today.loading') }}
      </div>

      <!-- Empty state -->
      <div
        v-else-if="entries.length === 0"
        class="text-ink-soft font-body py-12 text-center text-sm"
      >
        {{ t('today.emptyState') }}
      </div>

      <!-- Entry list -->
      <ul v-else class="flex flex-col gap-2">
        <li
          v-for="entry in entries"
          :key="entry.id"
          class="surface-card flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm"
        >
          <AppCheckbox
            :model-value="taskMap.get(entry.taskId)?.status === 'done'"
            :label="taskMap.get(entry.taskId)?.title ?? '...'"
            @update:model-value="
              handleToggleDone(entry.taskId, taskMap.get(entry.taskId)?.status ?? 'open')
            "
          />

          <span class="font-body text-ink min-w-0 flex-1 truncate text-sm">
            {{ taskMap.get(entry.taskId)?.title ?? '...' }}
          </span>

          <button
            class="text-ink-soft hover:text-sage cursor-pointer transition-colors"
            :aria-label="t('today.mitLabel')"
            @click="handleToggleMIT(entry.id, entry.isMIT)"
          >
            <AppBadge v-if="entry.isMIT" variant="done">
              <template #icon>
                <AppIcon name="zap" :size="12" />
              </template>
              {{ t('today.mitLabel') }}
            </AppBadge>
            <AppIcon v-else name="zap" :size="16" />
          </button>

          <button
            class="text-ink-soft hover:text-danger cursor-pointer transition-colors"
            @click="removeEntry(entry.id)"
          >
            <AppIcon name="x" :size="16" />
          </button>
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
