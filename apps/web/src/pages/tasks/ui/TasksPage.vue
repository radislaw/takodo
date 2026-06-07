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

const rootTasks = computed(() => (taskList.value ?? []).filter((t) => !t.parentId))

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

      <div v-else class="flex flex-col">
        <TaskCard
          v-for="task in rootTasks"
          :key="task.id"
          :task="task"
          :child-done="childProgress.get(task.id)?.done"
          :child-total="childProgress.get(task.id)?.total"
        />
      </div>
    </main>
  </div>
</template>
