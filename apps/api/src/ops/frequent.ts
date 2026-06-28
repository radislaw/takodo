import type { PrismaClient } from '@prisma/client'
import { aggregateFrequent } from '../domain/frequent.js'
import { taskToDomain } from '../domain/types.js'
import type { DomainDailyEntry, FrequentTaskResult } from '../domain/types.js'

/**
 * Frequently-undone aggregation, shared by the HTTP handler and AI tools.
 * Windowed to the last 30 days of daily lists (unbounded-growth guard).
 */
export async function listFrequent(
  prisma: PrismaClient,
  userId: string,
  minDays = 1,
): Promise<FrequentTaskResult[]> {
  const windowStart = new Date()
  windowStart.setUTCDate(windowStart.getUTCDate() - 30)
  windowStart.setUTCHours(0, 0, 0, 0)

  const tasks = await prisma.task.findMany({ where: { userId } })
  const dailyLists = await prisma.dailyList.findMany({
    where: { userId, date: { gte: windowStart } },
    include: { entries: true },
  })

  const domainTasks = tasks.map(taskToDomain)
  const domainEntries: DomainDailyEntry[] = dailyLists.flatMap((list) =>
    list.entries.map((e) => ({ dailyListId: list.id, taskId: e.taskId })),
  )

  return aggregateFrequent(domainEntries, domainTasks, minDays)
}
