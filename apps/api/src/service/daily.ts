import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { toDateStr, parseDate } from '../domain/date.js'
import { normalizeTitle } from '../domain/normalize.js'
import { getDailyByDate, addEntry, updateEntry, moveToTomorrow } from '../ops/daily.js'
import { sendOpError } from './op-reply.js'
import type { GetUserId } from '../auth/guard.js'

export function buildDailyHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Daily_create(req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId(req)
      const { date } = req.body as { date: string }
      const dateVal = parseDate(date)

      const existing = await prisma.dailyList.findUnique({
        where: { userId_date: { userId, date: dateVal } },
      })
      if (existing) {
        return { ...existing, date: toDateStr(existing.date) }
      }

      const list = await prisma.dailyList.create({
        data: { userId, date: dateVal },
      })
      return { id: list.id, date: toDateStr(list.date), createdAt: list.createdAt }
    },

    async Daily_getByDate(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { date } = req.params as { date: string }
      try {
        return await getDailyByDate(prisma, userId, date)
      } catch (e) {
        return sendOpError(reply, e)
      }
    },

    async Daily_addEntry(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { date } = req.params as { date: string }
      const { taskId } = req.body as { taskId: string }
      try {
        return await addEntry(prisma, userId, date, taskId)
      } catch (e) {
        return sendOpError(reply, e)
      }
    },

    async Daily_updateEntry(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { date, entryId } = req.params as { date: string; entryId: string }
      const body = req.body as { isMIT?: boolean; order?: number }
      try {
        return await updateEntry(prisma, userId, date, entryId, body)
      } catch (e) {
        return sendOpError(reply, e)
      }
    },

    async Daily_removeEntry(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
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

    async Daily_moveToTomorrow(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { date, entryId } = req.params as { date: string; entryId: string }
      try {
        return await moveToTomorrow(prisma, userId, date, entryId)
      } catch (e) {
        return sendOpError(reply, e)
      }
    },

    async Daily_setNote(req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId(req)
      const { date } = req.params as { date: string }
      const { note } = req.body as { note: string }
      const dateVal = parseDate(date)

      const list = await prisma.dailyList.upsert({
        where: { userId_date: { userId, date: dateVal } },
        create: { userId, date: dateVal, note },
        update: { note },
        include: {
          entries: {
            orderBy: { order: 'asc' },
            select: { id: true, taskId: true, isMIT: true, order: true },
          },
        },
      })

      return {
        id: list.id,
        date: toDateStr(list.date),
        createdAt: list.createdAt,
        entries: list.entries,
        note: list.note ?? undefined,
      }
    },

    async Daily_logDone(req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId(req)
      const { date } = req.params as { date: string }
      const { title } = req.body as { title: string }
      const dateVal = parseDate(date)
      const now = new Date()

      const entry = await prisma.$transaction(async (tx) => {
        const list = await tx.dailyList.upsert({
          where: { userId_date: { userId, date: dateVal } },
          create: { userId, date: dateVal },
          update: {},
        })

        // Persist as already-done so it counts toward heatmap / streak / XP.
        const task = await tx.task.create({
          data: {
            userId,
            title,
            status: 'done',
            completedAt: now,
            normalizedTitle: normalizeTitle(title),
          },
        })

        const lastEntry = await tx.dailyEntry.findFirst({
          where: { dailyListId: list.id },
          orderBy: { order: 'desc' },
        })

        return tx.dailyEntry.create({
          data: {
            dailyListId: list.id,
            taskId: task.id,
            isMIT: false,
            order: (lastEntry?.order ?? -1) + 1,
          },
        })
      })

      return { id: entry.id, taskId: entry.taskId, isMIT: entry.isMIT, order: entry.order }
    },
  }
}
