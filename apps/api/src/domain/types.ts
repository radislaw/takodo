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
