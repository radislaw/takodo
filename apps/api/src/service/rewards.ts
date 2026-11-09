import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { computeRewards, computeHeatmap } from '../domain/rewards.js'
import { parseDate, resolveClientDate } from '../domain/date.js'
import type { GetUserId } from '../auth/guard.js'

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_WEEKS = 12
const MAX_WEEKS = 53

function resolveWeeks(raw: string | number | undefined): number {
  const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : raw
  if (!n || Number.isNaN(n) || n < 1) return DEFAULT_WEEKS
  return Math.min(n, MAX_WEEKS)
}

export function buildRewardsHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Rewards_get(req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId(req)
      const [completedTasks, mitCompletions, user, questXpSum] = await Promise.all([
        prisma.task.findMany({
          where: { userId, status: 'done', completedAt: { not: null } },
          select: { completedAt: true, pomodoros: true },
        }),
        prisma.dailyEntry.count({
          where: { isMIT: true, dailyList: { userId }, task: { status: 'done' } },
        }),
        prisma.user.findUnique({ where: { id: userId }, select: { gentleMoves: true } }),
        prisma.questClaim.aggregate({ _sum: { xp: true }, where: { userId } }),
      ])
      const tasks = completedTasks.map((t) => ({
        completedAt: t.completedAt!,
        pomodoros: t.pomodoros,
      }))
      return computeRewards(
        tasks,
        new Date(),
        user?.gentleMoves ?? 0,
        mitCompletions,
        questXpSum._sum.xp ?? 0,
      )
    },

    async Rewards_heatmap(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const query = req.query as { weeks?: string; date?: string }
      const dateStr = resolveClientDate(query.date)
      if (!dateStr) {
        return reply
          .status(400)
          .send({ code: 'invalid_date', message: 'Date must be within 1 day of server today' })
      }
      const weeks = resolveWeeks(query.weeks)

      // Window the query: only completions from the grid's first day onward.
      const windowStart = new Date(parseDate(dateStr).getTime() - weeks * 7 * DAY_MS)
      const completedTasks = await prisma.task.findMany({
        where: { userId, status: 'done', completedAt: { gte: windowStart } },
        select: { completedAt: true },
      })
      const tasks = completedTasks.map((t) => ({ completedAt: t.completedAt!, pomodoros: 0 }))
      return computeHeatmap(tasks, parseDate(dateStr), weeks)
    },
  }
}
