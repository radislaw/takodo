import type OpenAI from 'openai'
import type { PrismaClient } from '@prisma/client'
import { listTasks, createTask, completeTask, reopenTask, splitTask } from '../ops/tasks.js'
import {
  getDailyByDate,
  ensureDailyList,
  addEntry,
  updateEntry,
  moveToTomorrow,
} from '../ops/daily.js'
import { listFrequent } from '../ops/frequent.js'
import { OpError, notFound } from '../ops/errors.js'
import type { AgentAction, ToolContext } from './types.js'

/**
 * The agent's toolset. Every tool wraps a `userId`-scoped op (`ops/*`), so the
 * model can never reach another user's data. The agent never destroys directly:
 * the only delete path is `request_delete_task`, which writes nothing and merely
 * surfaces a confirmation the user must tap (so the "reversible actions only"
 * invariant holds even under prompt injection). set_mit / move_to_tomorrow take
 * a `taskId` (the agent thinks in tasks) and resolve the daily entry internally.
 */

type ToolArgs = Record<string, unknown>

interface ToolOutcome {
  /** JSON-serializable payload fed back to the model as the tool result. */
  result: unknown
  /** Optional transparency record surfaced to the UI as an action chip. */
  action?: AgentAction
  /** For tools that take several actions in one call (e.g. split_task). */
  actions?: AgentAction[]
}

interface ToolImpl {
  def: OpenAI.Chat.Completions.ChatCompletionFunctionTool
  run(prisma: PrismaClient, ctx: ToolContext, args: ToolArgs): Promise<ToolOutcome>
}

function str(args: ToolArgs, key: string): string {
  const v = args[key]
  if (typeof v !== 'string' || v.trim() === '') {
    throw new OpError('bad_args', 400, `Missing required string "${key}"`)
  }
  return v
}

/** Resolve the daily entry for a task on `today`, or a clear error to retry from. */
async function entryForTask(
  prisma: PrismaClient,
  ctx: ToolContext,
  taskId: string,
): Promise<string> {
  const today = await getDailyByDate(prisma, ctx.userId, ctx.today).catch((e) => {
    if (e instanceof OpError) return null
    throw e
  })
  const entry = today?.entries.find((en) => en.taskId === taskId)
  if (!entry) {
    throw notFound("Task is not in today's list — call add_to_today first")
  }
  return entry.id
}

const TOOLS: ToolImpl[] = [
  {
    def: {
      type: 'function',
      function: {
        name: 'list_tasks',
        description:
          "List the user's open (not-done) tasks: id, title, parentId. Capped to keep the context small.",
        parameters: { type: 'object', properties: {} },
      },
    },
    async run(prisma, ctx) {
      const tasks = await listTasks(prisma, ctx.userId)
      const open = tasks.filter((t) => t.status === 'open')
      const CAP = 40
      return {
        result: {
          tasks: open
            .slice(0, CAP)
            .map((t) => ({ id: t.id, title: t.title, parentId: t.parentId })),
          totalOpen: open.length,
          truncated: open.length > CAP,
        },
      }
    },
  },
  {
    def: {
      type: 'function',
      function: {
        name: 'get_today',
        description: "Get today's list: the tasks scheduled for today and which are MIT.",
        parameters: { type: 'object', properties: {} },
      },
    },
    async run(prisma, ctx) {
      const today = await getDailyByDate(prisma, ctx.userId, ctx.today).catch((e) => {
        if (e instanceof OpError) return null
        throw e
      })
      if (!today) return { result: { entries: [] } }
      const tasks = await listTasks(prisma, ctx.userId)
      const titleOf = new Map(tasks.map((t) => [t.id, t.title]))
      return {
        result: {
          date: today.date,
          entries: today.entries.map((e) => ({
            taskId: e.taskId,
            title: titleOf.get(e.taskId) ?? null,
            isMIT: e.isMIT,
          })),
        },
      }
    },
  },
  {
    def: {
      type: 'function',
      function: {
        name: 'get_day',
        description:
          "Get the user's task list for ANY past or future day (e.g. yesterday). Use this whenever the user asks about a day other than today — \"what didn't I finish yesterday\", tasks on a date, etc. Compute the date from today's date given in the prompt. Each entry tells you the task title and whether it is done.",
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Target day as YYYY-MM-DD.' },
          },
          required: ['date'],
        },
      },
    },
    async run(prisma, ctx, args) {
      const date = str(args, 'date')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new OpError('bad_args', 400, 'date must be in YYYY-MM-DD format')
      }
      const day = await getDailyByDate(prisma, ctx.userId, date).catch((e) => {
        if (e instanceof OpError) return null
        throw e
      })
      if (!day) return { result: { date, entries: [] } }
      const tasks = await listTasks(prisma, ctx.userId)
      const byId = new Map(tasks.map((t) => [t.id, t]))
      return {
        result: {
          date: day.date,
          entries: day.entries.map((e) => {
            const task = byId.get(e.taskId)
            return {
              taskId: e.taskId,
              title: task?.title ?? null,
              isMIT: e.isMIT,
              done: task?.status === 'done',
            }
          }),
        },
      }
    },
  },
  {
    def: {
      type: 'function',
      function: {
        name: 'list_frequent',
        description: 'List tasks that keep coming back undone across recent days.',
        parameters: {
          type: 'object',
          properties: {
            minDays: { type: 'integer', description: 'Minimum undone-days threshold (default 1).' },
          },
        },
      },
    },
    async run(prisma, ctx, args) {
      const minDays = typeof args.minDays === 'number' ? args.minDays : 1
      return { result: await listFrequent(prisma, ctx.userId, minDays) }
    },
  },
  {
    def: {
      type: 'function',
      function: {
        name: 'create_task',
        description:
          'Create a task. Pass parentId to make it a subtask (a split step) of another task.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Short task title.' },
            note: { type: 'string' },
            parentId: {
              type: 'string',
              description: 'Parent task id when splitting; omit for top-level.',
            },
            estimateMinutes: { type: 'integer' },
            category: { type: 'string', enum: ['home', 'health', 'work', 'self'] },
          },
          required: ['title'],
        },
      },
    },
    async run(prisma, ctx, args) {
      const task = await createTask(prisma, ctx.userId, {
        title: str(args, 'title'),
        note: typeof args.note === 'string' ? args.note : undefined,
        parentId: typeof args.parentId === 'string' ? args.parentId : undefined,
        estimateMinutes:
          typeof args.estimateMinutes === 'number' ? args.estimateMinutes : undefined,
        category: typeof args.category === 'string' ? args.category : undefined,
      })
      return {
        result: { id: task.id, title: task.title, parentId: task.parentId },
        action: { kind: 'create_task', taskId: task.id, title: task.title },
      }
    },
  },
  {
    def: {
      type: 'function',
      function: {
        name: 'split_task',
        description:
          'Split ONE task into smaller sub-steps in a single call. Every step becomes a subtask (child) of parentTaskId, and the FIRST step is added to today so the user can start right now. ALWAYS use this to break a task down — never call create_task repeatedly for splitting.',
        parameters: {
          type: 'object',
          properties: {
            parentTaskId: {
              type: 'string',
              description:
                'Id of the task being split. Get it from list_tasks / get_today, or from a create_task result if you just created the parent.',
            },
            steps: {
              type: 'array',
              items: { type: 'string' },
              description: 'Ordered sub-step titles, smallest / first-actionable step first.',
            },
          },
          required: ['parentTaskId', 'steps'],
        },
      },
    },
    async run(prisma, ctx, args) {
      const parentTaskId = str(args, 'parentTaskId')
      const steps = Array.isArray(args.steps)
        ? args.steps.filter((s): s is string => typeof s === 'string' && s.trim() !== '')
        : []
      if (steps.length === 0) {
        throw new OpError('bad_args', 400, 'steps must be a non-empty array of step titles')
      }

      // One transactional op: all subtasks + the today-scheduling either land
      // together or not at all (no half-built split on a mid-loop failure).
      const { created, firstStepOnToday } = await splitTask(prisma, ctx.userId, {
        parentTaskId,
        steps,
        today: ctx.today,
      })
      const first = created.find((t) => t.id === firstStepOnToday)!

      return {
        result: {
          created: created.map((t) => ({ id: t.id, title: t.title, parentId: t.parentId })),
          firstStepOnToday,
        },
        actions: [
          ...created.map((t) => ({ kind: 'create_task', taskId: t.id, title: t.title })),
          { kind: 'add_to_today', taskId: first.id, title: first.title },
        ],
      }
    },
  },
  {
    def: {
      type: 'function',
      function: {
        name: 'complete_task',
        description: 'Mark a task done. Parents auto-complete when all their children are done.',
        parameters: {
          type: 'object',
          properties: { taskId: { type: 'string' } },
          required: ['taskId'],
        },
      },
    },
    async run(prisma, ctx, args) {
      const task = await completeTask(prisma, ctx.userId, str(args, 'taskId'))
      return {
        result: { id: task.id, title: task.title, status: task.status },
        action: { kind: 'complete_task', taskId: task.id, title: task.title },
      }
    },
  },
  {
    def: {
      type: 'function',
      function: {
        name: 'reopen_task',
        description: 'Reopen a done task (and its subtree).',
        parameters: {
          type: 'object',
          properties: { taskId: { type: 'string' } },
          required: ['taskId'],
        },
      },
    },
    async run(prisma, ctx, args) {
      const task = await reopenTask(prisma, ctx.userId, str(args, 'taskId'))
      return {
        result: { id: task.id, title: task.title, status: task.status },
        action: { kind: 'reopen_task', taskId: task.id, title: task.title },
      }
    },
  },
  {
    def: {
      type: 'function',
      function: {
        name: 'add_to_today',
        description: "Add a task to today's list so the user can focus on it today.",
        parameters: {
          type: 'object',
          properties: { taskId: { type: 'string' } },
          required: ['taskId'],
        },
      },
    },
    async run(prisma, ctx, args) {
      const taskId = str(args, 'taskId')
      await ensureDailyList(prisma, ctx.userId, ctx.today)
      const entry = await addEntry(prisma, ctx.userId, ctx.today, taskId)
      return {
        result: { entryId: entry.id, taskId: entry.taskId },
        action: { kind: 'add_to_today', taskId },
      }
    },
  },
  {
    def: {
      type: 'function',
      function: {
        name: 'set_mit',
        description:
          "Mark/unmark a today task as a Most Important Task (max 3). The task must already be in today's list.",
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            isMIT: { type: 'boolean' },
          },
          required: ['taskId', 'isMIT'],
        },
      },
    },
    async run(prisma, ctx, args) {
      const taskId = str(args, 'taskId')
      const isMIT = args.isMIT !== false
      const entryId = await entryForTask(prisma, ctx, taskId)
      const entry = await updateEntry(prisma, ctx.userId, ctx.today, entryId, { isMIT })
      return {
        result: { taskId, isMIT: entry.isMIT },
        action: { kind: 'set_mit', taskId },
      }
    },
  },
  {
    def: {
      type: 'function',
      function: {
        name: 'move_to_tomorrow',
        description: "Gently move a today task to tomorrow. The task must be in today's list.",
        parameters: {
          type: 'object',
          properties: { taskId: { type: 'string' } },
          required: ['taskId'],
        },
      },
    },
    async run(prisma, ctx, args) {
      const taskId = str(args, 'taskId')
      const entryId = await entryForTask(prisma, ctx, taskId)
      await moveToTomorrow(prisma, ctx.userId, ctx.today, entryId)
      return {
        result: { taskId, movedTo: 'tomorrow' },
        action: { kind: 'move_to_tomorrow', taskId },
      }
    },
  },
  {
    def: {
      type: 'function',
      function: {
        name: 'request_delete_task',
        description:
          "Ask the user to confirm permanently deleting a task (and all its subtasks). You do NOT delete anything — this only surfaces a confirmation button the user must tap. Deletion is irreversible, so it always goes through the user. Use only when the user clearly wants a task gone. After calling, tell the user you've asked them to confirm — never claim the task is already deleted.",
        parameters: {
          type: 'object',
          properties: { taskId: { type: 'string' } },
          required: ['taskId'],
        },
      },
    },
    async run(prisma, ctx, args) {
      const taskId = str(args, 'taskId')
      // Ownership check only — no write. The agent proposes; the user disposes.
      const task = await prisma.task.findUnique({ where: { id: taskId } })
      if (!task || task.userId !== ctx.userId) throw notFound('Task not found')
      return {
        result: { taskId, title: task.title, status: 'awaiting_user_confirmation' },
        action: { kind: 'request_delete', taskId, title: task.title },
      }
    },
  },
]

export interface ToolRegistry {
  defs: OpenAI.Chat.Completions.ChatCompletionFunctionTool[]
  get(name: string): ToolImpl | undefined
}

export function buildToolRegistry(): ToolRegistry {
  const byName = new Map(TOOLS.map((t) => [t.def.function.name, t]))
  return {
    defs: TOOLS.map((t) => t.def),
    get: (name) => byName.get(name),
  }
}
