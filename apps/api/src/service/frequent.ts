import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { aggregateFrequent } from '../domain/frequent.js'
import { taskToDomain } from '../domain/types.js'
import type { DomainDailyEntry } from '../domain/types.js'
import type { GetUserId } from '../auth/guard.js'

export function buildFrequentHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Frequent_list(req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId(req)
      const query = req.query as { minDays?: string }
      const minDays = query.minDays !== undefined ? parseInt(query.minDays, 10) : 1

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
    },
  }
}
