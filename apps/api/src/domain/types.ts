import type { Task } from '@prisma/client'

export interface DomainTask {
  id: string
  parentId: string | null
  title: string
  note?: string | null
  resistanceResolved: boolean
  estimateMinutes?: number | null
  status: 'open' | 'done'
  completedAt: Date | null
  normalizedTitle: string
  createdAt: Date
  focusSeconds?: number
  pomodoros?: number
}

export interface TaskNode extends DomainTask {
  children: TaskNode[]
}

export interface DomainDailyEntry {
  dailyListId: string
  taskId: string
}

export interface FrequentTaskResult {
  normalizedTitle: string
  title: string
  undoneDays: number
}

export function taskToDomain(task: Task): DomainTask {
  return {
    id: task.id,
    parentId: task.parentId,
    title: task.title,
    note: task.note,
    resistanceResolved: task.resistanceResolved,
    estimateMinutes: task.estimateMinutes,
    status: task.status as 'open' | 'done',
    completedAt: task.completedAt,
    normalizedTitle: task.normalizedTitle,
    createdAt: task.createdAt,
    focusSeconds: task.focusSeconds,
    pomodoros: task.pomodoros,
  }
}
