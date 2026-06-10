import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'

type GetUserId = () => Promise<string>

function dateToString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

export function buildDailyHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Daily_create(req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId()
      const { date } = req.body as { date: string }
      const dateVal = parseDate(date)

      const existing = await prisma.dailyList.findUnique({
        where: { userId_date: { userId, date: dateVal } },
      })
      if (existing) {
        return { ...existing, date: dateToString(existing.date) }
      }

      const list = await prisma.dailyList.create({
        data: { userId, date: dateVal },
      })
      return { id: list.id, date: dateToString(list.date), createdAt: list.createdAt }
    },

    async Daily_getByDate(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const { date } = req.params as { date: string }
      const dateVal = parseDate(date)

      const list = await prisma.dailyList.findUnique({
        where: { userId_date: { userId, date: dateVal } },
        include: {
          entries: {
            orderBy: { order: 'asc' },
            select: { id: true, taskId: true, isMIT: true, order: true },
          },
        },
      })

      if (!list) {
        return reply.status(404).send({ code: 'not_found', message: 'Daily list not found' })
      }

      return {
        id: list.id,
        date: dateToString(list.date),
        createdAt: list.createdAt,
        entries: list.entries,
      }
    },

    async Daily_addEntry(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const { date } = req.params as { date: string }
      const { taskId } = req.body as { taskId: string }
      const dateVal = parseDate(date)

      const task = await prisma.task.findUnique({ where: { id: taskId } })
      if (!task || task.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }

      const entry = await prisma.$transaction(async (tx) => {
        const list = await tx.dailyList.findUnique({
          where: { userId_date: { userId, date: dateVal } },
          include: { entries: true },
        })
        if (!list) {
          return reply.status(404).send({ code: 'not_found', message: 'Daily list not found' })
        }

        const mitCount = list.entries.filter((e) => e.isMIT).length
        const maxOrder = list.entries.reduce((m, e) => Math.max(m, e.order), -1)

        return tx.dailyEntry.create({
          data: {
            dailyListId: list.id,
            taskId,
            isMIT: mitCount < 3,
            order: maxOrder + 1,
          },
        })
      })

      if (!('id' in entry)) return entry
      return { id: entry.id, taskId: entry.taskId, isMIT: entry.isMIT, order: entry.order }
    },

    async Daily_updateEntry(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const { date, entryId } = req.params as { date: string; entryId: string }
      const dateVal = parseDate(date)

      const list = await prisma.dailyList.findUnique({
        where: { userId_date: { userId, date: dateVal } },
        include: { entries: true },
      })
      if (!list) {
        return reply.status(404).send({ code: 'not_found', message: 'Daily list not found' })
      }

      const existingEntry = list.entries.find((e) => e.id === entryId)
      if (!existingEntry) {
        return reply.status(404).send({ code: 'not_found', message: 'Entry not found' })
      }

      const body = req.body as { isMIT?: boolean; order?: number }

      // enforce MIT limit of 3
      if (body.isMIT === true) {
        const mitCount = list.entries.filter((e) => e.isMIT && e.id !== entryId).length
        if (mitCount >= 3) {
          return reply.status(400).send({ code: 'mit_limit', message: 'MIT limit of 3 reached' })
        }
      }

      const entry = await prisma.dailyEntry.update({
        where: { id: entryId },
        data: { isMIT: body.isMIT, order: body.order },
      })

      return { id: entry.id, taskId: entry.taskId, isMIT: entry.isMIT, order: entry.order }
    },

    async Daily_removeEntry(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const { date, entryId } = req.params as { date: string; entryId: string }
      const dateVal = parseDate(date)

      const list = await prisma.dailyList.findUnique({
        where: { userId_date: { userId, date: dateVal } },
        include: { entries: { where: { id: entryId } } },
      })
      if (!list || list.entries.length === 0) {
        return reply.status(404).send({ code: 'not_found', message: 'Entry not found' })
      }

      await prisma.dailyEntry.delete({ where: { id: entryId } })
      return reply.status(204).send()
    },
  }
}
