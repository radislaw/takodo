import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDailyToday, useTasks } from '@/shared/api'

export function useTodayLogic() {
  const { t } = useI18n({ useScope: 'global' })
  const { data: daily, isPending } = useDailyToday()
  const { data: taskList } = useTasks()

  const taskMap = computed(() => {
    const map = new Map<
      string,
      { id: string; title: string; status: string; category?: string | null }
    >()
    for (const task of taskList.value ?? []) map.set(task.id, task)
    return map
  })

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

  const entries = computed(() => daily.value?.entries ?? [])

  const doneCount = computed(
    () => entries.value.filter((e) => taskMap.value.get(e.taskId)?.status === 'done').length,
  )

  const activeEntries = computed(() =>
    entries.value
      .filter((e) => taskMap.value.get(e.taskId)?.status !== 'done')
      .sort((a, b) => Number(b.isMIT) - Number(a.isMIT)),
  )

  const doneEntries = computed(() =>
    entries.value.filter((e) => taskMap.value.get(e.taskId)?.status === 'done'),
  )

  const nextEntry = computed(() => activeEntries.value[0])

  const nextTask = computed(() =>
    nextEntry.value ? taskMap.value.get(nextEntry.value.taskId) : undefined,
  )

  const categoryCounts = computed(() => {
    const acc = new Map<string, number>()
    for (const entry of activeEntries.value) {
      const category = taskMap.value.get(entry.taskId)?.category
      if (!category) continue
      acc.set(category, (acc.get(category) ?? 0) + 1)
    }
    return [...acc.entries()].map(([category, count]) => ({ category, count }))
  })

  const summaryMsg = computed(() => {
    const left = entries.value.length - doneCount.value
    if (entries.value.length === 0) return t('today.summary.start')
    if (left === 0) return t('today.summary.all_done')
    if (left <= 2) return t('today.summary.almost')
    return t('today.summary.start')
  })

  return {
    daily,
    isPending,
    taskMap,
    childProgress,
    entries,
    doneCount,
    activeEntries,
    doneEntries,
    nextEntry,
    nextTask,
    categoryCounts,
    summaryMsg,
  }
}
