<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppInput, AppIcon } from '@/shared/ui'
import { useTasks, useCreateTask } from '@/shared/api'
import TaskCard from './TaskCard.vue'

const { t } = useI18n({ useScope: 'global' })
const { data: taskList, isPending } = useTasks()
const { mutateAsync: createTask } = useCreateTask()

const newTitle = ref('')
const isAdding = ref(false)

const rootTasks = computed(() => (taskList.value ?? []).filter((task) => !task.parentId))

const childProgress = computed(() => {
  const map = new Map<string, { done: number; total: number }>()
  for (const task of taskList.value ?? []) {
    if (!task.parentId) continue
    const entry = map.get(task.parentId) ?? { done: 0, total: 0 }
    entry.total++
    if (task.status === 'done') entry.done++
    map.set(task.parentId, entry)
  }
  return map
})

function formatDateLabel(dateStr: string): string {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today) return t('tasks.dateGroup.today')
  if (dateStr === yesterday) return t('tasks.dateGroup.yesterday')
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  })
}

const groupedTasks = computed(() => {
  const groups = new Map<string, typeof rootTasks.value>()
  for (const task of rootTasks.value) {
    const date = (task.createdAt ?? '').slice(0, 10) || 'unknown'
    const arr = groups.get(date) ?? []
    arr.push(task)
    groups.set(date, arr)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, tasks]) => ({ date, label: formatDateLabel(date), tasks }))
})

async function handleAdd() {
  const title = newTitle.value.trim()
  if (!title) return
  isAdding.value = true
  try {
    await createTask({ title })
    newTitle.value = ''
  } finally {
    isAdding.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleAdd()
}
</script>

<template>
  <div class="surface-app pb-nav min-h-full">
    <header class="surface-card border-line sticky top-0 z-10 border-b shadow-sm">
      <div class="px-5 py-4">
        <h1 class="font-display text-ink text-xl leading-tight font-extrabold">
          {{ t('tasks.title') }}
        </h1>
      </div>
    </header>

    <main class="mx-auto max-w-xl px-4 pt-6">
      <div class="surface-card mb-5 flex gap-2 rounded-2xl p-4 shadow-sm">
        <AppInput
          v-model="newTitle"
          :placeholder="t('tasks.addPlaceholder')"
          class="flex-1"
          @keydown="handleKeydown"
        />
        <AppButton variant="primary" :disabled="isAdding || !newTitle.trim()" @click="handleAdd">
          <AppIcon v-if="isAdding" name="sparkles" :size="16" color="#fff" />
          <AppIcon v-else name="plus" :size="16" color="#fff" :stroke-width="2.4" />
          {{ t('tasks.addButton') }}
        </AppButton>
      </div>

      <div v-if="isPending" class="text-ink-soft font-body py-12 text-center text-sm">
        {{ t('tasks.loading') }}
      </div>

      <div
        v-else-if="rootTasks.length === 0"
        class="text-ink-soft font-body py-12 text-center text-sm"
      >
        {{ t('tasks.empty') }}
      </div>

      <div v-else class="flex flex-col gap-4">
        <section v-for="group in groupedTasks" :key="group.date">
          <h2
            class="font-body text-ink-soft mb-2 px-1 text-xs font-semibold tracking-widest uppercase"
          >
            {{ group.label }}
          </h2>
          <div class="flex flex-col">
            <TaskCard
              v-for="task in group.tasks"
              :key="task.id"
              :task="task"
              :child-done="childProgress.get(task.id)?.done"
              :child-total="childProgress.get(task.id)?.total"
            />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
