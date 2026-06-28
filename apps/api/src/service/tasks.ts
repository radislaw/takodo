import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { normalizeTitle } from '../domain/normalize.js'
import {
  listTasks,
  createTask,
  getTaskTree,
  completeTask,
  reopenTask,
  toTaskResponse,
} from '../ops/tasks.js'
import { sendOpError } from './op-reply.js'
import type { GetUserId } from '../auth/guard.js'

export function buildTasksHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Tasks_list(req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId(req)
      return listTasks(prisma, userId)
    },

    async Tasks_create(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const body = req.body as {
        title: string
        note?: string
        parentId?: string
        estimateMinutes?: number
        category?: string
      }
      try {
        return await createTask(prisma, userId, body)
      } catch (e) {
        return sendOpError(reply, e)
      }
    },

    async Tasks_read(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      const task = await prisma.task.findUnique({ where: { id } })
      if (!task || task.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }
      return toTaskResponse(task)
    },

    async Tasks_update(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      const existing = await prisma.task.findUnique({ where: { id } })
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }
      const body = req.body as {
        title?: string
        note?: string
        estimateMinutes?: number
        category?: string
      }
      const task = await prisma.task.update({
        where: { id },
        data: {
          title: body.title,
          note: body.note,
          estimateMinutes: body.estimateMinutes,
          category: body.category,
          ...(body.title ? { normalizedTitle: normalizeTitle(body.title) } : {}),
        },
      })
      return toTaskResponse(task)
    },

    async Tasks_del(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      const existing = await prisma.task.findUnique({ where: { id } })
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }
      await prisma.task.delete({ where: { id } })
      return reply.status(204).send()
    },

    async Tasks_tree(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      try {
        return await getTaskTree(prisma, userId, id)
      } catch (e) {
        return sendOpError(reply, e)
      }
    },

    async Tasks_complete(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      try {
        return await completeTask(prisma, userId, id)
      } catch (e) {
        return sendOpError(reply, e)
      }
    },

    async Tasks_reopen(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      try {
        return await reopenTask(prisma, userId, id)
      } catch (e) {
        return sendOpError(reply, e)
      }
    },

    async Tasks_resolveResistance(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      const existing = await prisma.task.findUnique({ where: { id } })
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }
      const task = await prisma.task.update({ where: { id }, data: { resistanceResolved: true } })
      return toTaskResponse(task)
    },

    async Tasks_recordFocus(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      const body = req.body as { seconds: number; pomodoro?: boolean }
      const existing = await prisma.task.findUnique({ where: { id } })
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }
      const task = await prisma.task.update({
        where: { id },
        data: {
          focusSeconds: { increment: body.seconds },
          ...(body.pomodoro ? { pomodoros: { increment: 1 } } : {}),
        },
      })
      return toTaskResponse(task)
    },
  }
}
