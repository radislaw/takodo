import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { computeRewards } from '../domain/rewards.js'

type GetUserId = () => Promise<string>

export function buildRewardsHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Rewards_get(_req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId()
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
  }
}
