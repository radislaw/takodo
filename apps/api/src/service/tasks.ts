import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient, Task } from '@prisma/client'
import { normalizeTitle } from '../domain/normalize.js'
import { assembleTree } from '../domain/tree.js'
import { bubbleUp, reopenTask, reopenAncestors } from '../domain/task-status.js'
import { taskToDomain } from '../domain/types.js'
import type { GetUserId } from '../auth/guard.js'

function toResponse(task: Task) {
  const { userId: _userId, ...rest } = task
  return rest
}

function findInTree(
  nodes: ReturnType<typeof assembleTree>,
  id: string,
): ReturnType<typeof assembleTree>[number] | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findInTree(node.children, id)
    if (found) return found
  }
  return null
}

export function buildTasksHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Tasks_list(req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId(req)
      const tasks = await prisma.task.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
      return tasks.map(toResponse)
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

      if (body.parentId) {
        const parent = await prisma.task.findUnique({ where: { id: body.parentId } })
        if (!parent || parent.userId !== userId) {
          return reply.status(404).send({ code: 'not_found', message: 'Parent task not found' })
        }
      }

      const task = await prisma.$transaction(async (tx) => {
        const created = await tx.task.create({
          data: {
            userId,
            title: body.title,
            note: body.note,
            parentId: body.parentId ?? null,
            estimateMinutes: body.estimateMinutes,
            category: body.category,
            normalizedTitle: normalizeTitle(body.title),
          },
        })

        if (body.parentId) {
          const allTasks = await tx.task.findMany({ where: { userId } })
          const parent = allTasks.find((t) => t.id === body.parentId)
          if (parent && parent.status === 'done') {
            const domainTasks = allTasks.map(taskToDomain)
            const afterReopen = reopenAncestors(domainTasks, created.id)
            const reopenedIds = afterReopen
              .filter((after) => {
                const before = domainTasks.find((t) => t.id === after.id)
                return before && before.status === 'done' && after.status === 'open'
              })
              .map((t) => t.id)
            if (reopenedIds.length > 0) {
              await tx.task.updateMany({
                where: { id: { in: reopenedIds } },
                data: { status: 'open', completedAt: null },
              })
            }
          }
        }

        return created
      })

      return toResponse(task)
    },

    async Tasks_read(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      const task = await prisma.task.findUnique({ where: { id } })
      if (!task || task.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }
      return toResponse(task)
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
      return toResponse(task)
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
      const allTasks = await prisma.task.findMany({ where: { userId } })
      const roots = assembleTree(allTasks.map(taskToDomain))
      const node = findInTree(roots, id)
      if (!node) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }
      return node
    },

    async Tasks_complete(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      const allTasks = await prisma.task.findMany({ where: { userId } })
      const target = allTasks.find((t) => t.id === id)
      if (!target) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }

      const now = new Date()
      const updatedTarget = { ...taskToDomain(target), status: 'done' as const, completedAt: now }
      const domainTasks = allTasks.map((t) => (t.id === id ? updatedTarget : taskToDomain(t)))
      const afterBubble = bubbleUp(domainTasks, id)

      const changedIds = afterBubble
        .filter((after) => {
          const before = domainTasks.find((t) => t.id === after.id)
          return before && before.status === 'open' && after.status === 'done'
        })
        .map((t) => t.id)

      const result = await prisma.$transaction(async (tx) => {
        await tx.task.update({ where: { id }, data: { status: 'done', completedAt: now } })
        if (changedIds.length > 0) {
          await tx.task.updateMany({
            where: { id: { in: changedIds } },
            data: { status: 'done', completedAt: now },
          })
        }
        return tx.task.findUnique({ where: { id } })
      })

      return toResponse(result!)
    },

    async Tasks_reopen(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      const allTasks = await prisma.task.findMany({ where: { userId } })
      const target = allTasks.find((t) => t.id === id)
      if (!target) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }

      const domainTasks = allTasks.map(taskToDomain)
      const afterReopen = reopenTask(domainTasks, id)

      const reopenedIds = afterReopen
        .filter((after) => {
          const before = domainTasks.find((t) => t.id === after.id)
          return before && before.status === 'done' && after.status === 'open'
        })
        .map((t) => t.id)

      const result = await prisma.$transaction(async (tx) => {
        if (reopenedIds.length > 0) {
          await tx.task.updateMany({
            where: { id: { in: reopenedIds } },
            data: { status: 'open', completedAt: null },
          })
        }
        return tx.task.findUnique({ where: { id } })
      })

      return toResponse(result!)
    },

    async Tasks_resolveResistance(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      const existing = await prisma.task.findUnique({ where: { id } })
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }
      const task = await prisma.task.update({ where: { id }, data: { resistanceResolved: true } })
      return toResponse(task)
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
      return toResponse(task)
    },
  }
}
