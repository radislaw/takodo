import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient, Task } from '@prisma/client'
import { normalizeTitle } from '../domain/normalize.js'
import { assembleTree } from '../domain/tree.js'
import { bubbleUp, reopenTask } from '../domain/task-status.js'
import type { DomainTask } from '../domain/types.js'

type GetUserId = () => Promise<string>

function toResponse(task: Task) {
  const { userId: _userId, ...rest } = task
  return rest
}

function toDomain(task: Task): DomainTask {
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
  }
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
    async Tasks_list(_req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId()
      const tasks = await prisma.task.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
      return tasks.map(toResponse)
    },

    async Tasks_create(req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId()
      const body = req.body as {
        title: string
        note?: string
        parentId?: string
        estimateMinutes?: number
      }
      const task = await prisma.task.create({
        data: {
          userId,
          title: body.title,
          note: body.note,
          parentId: body.parentId ?? null,
          estimateMinutes: body.estimateMinutes,
          normalizedTitle: normalizeTitle(body.title),
        },
      })
      return toResponse(task)
    },

    async Tasks_read(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const { id } = req.params as { id: string }
      const task = await prisma.task.findUnique({ where: { id } })
      if (!task || task.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }
      return toResponse(task)
    },

    async Tasks_update(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const { id } = req.params as { id: string }
      const existing = await prisma.task.findUnique({ where: { id } })
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }
      const body = req.body as { title?: string; note?: string; estimateMinutes?: number }
      const task = await prisma.task.update({
        where: { id },
        data: {
          title: body.title,
          note: body.note,
          estimateMinutes: body.estimateMinutes,
          ...(body.title ? { normalizedTitle: normalizeTitle(body.title) } : {}),
        },
      })
      return toResponse(task)
    },

    async Tasks_del(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const { id } = req.params as { id: string }
      const existing = await prisma.task.findUnique({ where: { id } })
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }
      await prisma.task.delete({ where: { id } })
      return reply.status(204).send()
    },

    async Tasks_tree(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const { id } = req.params as { id: string }
      const allTasks = await prisma.task.findMany({ where: { userId } })
      const roots = assembleTree(allTasks.map(toDomain))
      const node = findInTree(roots, id)
      if (!node) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }
      return node
    },

    async Tasks_complete(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const { id } = req.params as { id: string }
      const allTasks = await prisma.task.findMany({ where: { userId } })
      const target = allTasks.find((t) => t.id === id)
      if (!target) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }

      const now = new Date()
      await prisma.task.update({ where: { id }, data: { status: 'done', completedAt: now } })

      const updatedTarget = { ...toDomain(target), status: 'done' as const, completedAt: now }
      const domainTasks = allTasks.map((t) => (t.id === id ? updatedTarget : toDomain(t)))
      const afterBubble = bubbleUp(domainTasks, id)

      const changedIds = afterBubble
        .filter((after) => {
          const before = domainTasks.find((t) => t.id === after.id)
          return before && before.status === 'open' && after.status === 'done'
        })
        .map((t) => t.id)

      if (changedIds.length > 0) {
        await prisma.task.updateMany({
          where: { id: { in: changedIds } },
          data: { status: 'done', completedAt: now },
        })
      }

      const result = await prisma.task.findUnique({ where: { id } })
      return toResponse(result!)
    },

    async Tasks_reopen(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const { id } = req.params as { id: string }
      const allTasks = await prisma.task.findMany({ where: { userId } })
      const target = allTasks.find((t) => t.id === id)
      if (!target) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }

      const domainTasks = allTasks.map(toDomain)
      const afterReopen = reopenTask(domainTasks, id)

      const reopenedIds = afterReopen
        .filter((after) => {
          const before = domainTasks.find((t) => t.id === after.id)
          return before && before.status === 'done' && after.status === 'open'
        })
        .map((t) => t.id)

      if (reopenedIds.length > 0) {
        await prisma.task.updateMany({
          where: { id: { in: reopenedIds } },
          data: { status: 'open', completedAt: null },
        })
      }

      const result = await prisma.task.findUnique({ where: { id } })
      return toResponse(result!)
    },

    async Tasks_resolveResistance(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const { id } = req.params as { id: string }
      const existing = await prisma.task.findUnique({ where: { id } })
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Task not found' })
      }
      const task = await prisma.task.update({ where: { id }, data: { resistanceResolved: true } })
      return toResponse(task)
    },
  }
}
