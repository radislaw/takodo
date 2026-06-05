import type { DomainTask, DomainDailyEntry, FrequentTaskResult } from './types.js'

export function aggregateFrequent(
  entries: DomainDailyEntry[],
  tasks: DomainTask[],
  minDays: number,
): FrequentTaskResult[] {
  const taskById = new Map(tasks.map((t) => [t.id, t]))

  // normalizedTitle → Set of dailyListIds where it was undone
  const undoneDays = new Map<string, Set<string>>()
  // normalizedTitle → title (for output)
  const titleByNorm = new Map<string, string>()

  for (const entry of entries) {
    const task = taskById.get(entry.taskId)
    if (!task || task.status !== 'open') continue

    const key = task.normalizedTitle
    if (!undoneDays.has(key)) undoneDays.set(key, new Set())
    undoneDays.get(key)!.add(entry.dailyListId)
    titleByNorm.set(key, task.title)
  }

  const results: FrequentTaskResult[] = []
  for (const [normalizedTitle, days] of undoneDays) {
    if (days.size >= minDays) {
      results.push({
        normalizedTitle,
        title: titleByNorm.get(normalizedTitle)!,
        undoneDays: days.size,
      })
    }
  }

  return results
}
