import type { PrismaClient, Task } from '@prisma/client'
import { normalizeTitle } from '../domain/normalize.js'
import { assembleTree } from '../domain/tree.js'
import { bubbleUp, reopenTask as reopenTaskTree, reopenAncestors } from '../domain/task-status.js'
import { taskToDomain, type TaskNode } from '../domain/types.js'
import { parseDate } from '../domain/date.js'
import { OpError, notFound } from './errors.js'

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

export interface SplitTaskInput {
  parentTaskId: string
  steps: string[]
  /** Client's local day (`YYYY-MM-DD`) the first step is scheduled onto. */
  today: string
}

export interface SplitTaskResult {
  created: TaskResponse[]
  firstStepOnToday: string
}

/**
 * Split one task into ordered sub-steps and schedule the first step on `today`,
 * all in a single transaction. Atomic by design: a failure on step N must not
 * leave steps 1…N-1 orphaned (the tool's previous per-step `createTask` loop
 * could). Mirrors `createTask`'s reopen-on-done-parent behaviour.
 */
export async function splitTask(
  prisma: PrismaClient,
  userId: string,
  input: SplitTaskInput,
): Promise<SplitTaskResult> {
  const { parentTaskId, steps, today } = input
  if (steps.length === 0) {
    throw new OpError('bad_args', 400, 'steps must be a non-empty array of step titles')
  }
  const dateVal = parseDate(today)

  const result = await prisma.$transaction(async (tx) => {
    const parent = await tx.task.findUnique({ where: { id: parentTaskId } })
    if (!parent || parent.userId !== userId) throw notFound('Parent task not found')

    const created: Task[] = []
    for (const title of steps) {
      created.push(
        await tx.task.create({
          data: { userId, title, parentId: parentTaskId, normalizedTitle: normalizeTitle(title) },
        }),
      )
    }
    const first = created[0]!

    // A split under a done parent reopens the parent chain (same as createTask).
    if (parent.status === 'done') {
      const allTasks = await tx.task.findMany({ where: { userId } })
      const domainTasks = allTasks.map(taskToDomain)
      const afterReopen = reopenAncestors(domainTasks, first.id)
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

    // Put the first step on today so the user can start immediately.
    const list = await tx.dailyList.upsert({
      where: { userId_date: { userId, date: dateVal } },
      create: { userId, date: dateVal },
      update: {},
    })
    const last = await tx.dailyEntry.findFirst({
      where: { dailyListId: list.id },
      orderBy: { order: 'desc' },
    })
    await tx.dailyEntry.create({
      data: {
        dailyListId: list.id,
        taskId: first.id,
        isMIT: false,
        order: (last?.order ?? -1) + 1,
      },
    })

    return { created, firstStepId: first.id }
  })

  return {
    created: result.created.map(toTaskResponse),
    firstStepOnToday: result.firstStepId,
  }
}
