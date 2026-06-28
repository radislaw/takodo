import type { PrismaClient, Task } from '@prisma/client'
import { normalizeTitle } from '../domain/normalize.js'
import { assembleTree } from '../domain/tree.js'
import { bubbleUp, reopenTask as reopenTaskTree, reopenAncestors } from '../domain/task-status.js'
import { taskToDomain, type TaskNode } from '../domain/types.js'
import { notFound } from './errors.js'

/**
 * Task operations: the single implementation shared by the HTTP handlers
 * (`service/tasks.ts`) and the AI agent tools (`ai/tools.ts`). Each op is
 * `(prisma, userId, …) → response`, ownership-scoped to `userId`, and throws
 * `OpError` instead of writing to a reply.
 */

export type TaskResponse = Omit<Task, 'userId'>

export function toTaskResponse(task: Task): TaskResponse {
  const { userId: _userId, ...rest } = task
  return rest
}

function findInTree(nodes: TaskNode[], id: string): TaskNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findInTree(node.children, id)
    if (found) return found
  }
  return null
}

export interface CreateTaskInput {
  title: string
  note?: string
  parentId?: string
  estimateMinutes?: number
  category?: string
}

export async function listTasks(prisma: PrismaClient, userId: string): Promise<TaskResponse[]> {
  const tasks = await prisma.task.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
  return tasks.map(toTaskResponse)
}

export async function createTask(
  prisma: PrismaClient,
  userId: string,
  input: CreateTaskInput,
): Promise<TaskResponse> {
  if (input.parentId) {
    const parent = await prisma.task.findUnique({ where: { id: input.parentId } })
    if (!parent || parent.userId !== userId) {
      throw notFound('Parent task not found')
    }
  }

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        userId,
        title: input.title,
        note: input.note,
        parentId: input.parentId ?? null,
        estimateMinutes: input.estimateMinutes,
        category: input.category,
        normalizedTitle: normalizeTitle(input.title),
      },
    })

    if (input.parentId) {
      const allTasks = await tx.task.findMany({ where: { userId } })
      const parent = allTasks.find((t) => t.id === input.parentId)
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

  return toTaskResponse(task)
}

export async function getTaskTree(
  prisma: PrismaClient,
  userId: string,
  id: string,
): Promise<TaskNode> {
  const allTasks = await prisma.task.findMany({ where: { userId } })
  const roots = assembleTree(allTasks.map(taskToDomain))
  const node = findInTree(roots, id)
  if (!node) throw notFound('Task not found')
  return node
}

export async function completeTask(
  prisma: PrismaClient,
  userId: string,
  id: string,
): Promise<TaskResponse> {
  const allTasks = await prisma.task.findMany({ where: { userId } })
  const target = allTasks.find((t) => t.id === id)
  if (!target) throw notFound('Task not found')

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

  return toTaskResponse(result!)
}

export async function reopenTask(
  prisma: PrismaClient,
  userId: string,
  id: string,
): Promise<TaskResponse> {
  const allTasks = await prisma.task.findMany({ where: { userId } })
  const target = allTasks.find((t) => t.id === id)
  if (!target) throw notFound('Task not found')

  const domainTasks = allTasks.map(taskToDomain)
  const afterReopen = reopenTaskTree(domainTasks, id)

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

  return toTaskResponse(result!)
}
