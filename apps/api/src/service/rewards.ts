import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { computeRewards } from '../domain/rewards.js'

type GetUserId = () => Promise<string>

export function buildRewardsHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Rewards_get(_req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId()
      const [completedTasks, user] = await Promise.all([
        prisma.task.findMany({
          where: { userId, status: 'done', completedAt: { not: null } },
          select: { completedAt: true },
        }),
        prisma.user.findUnique({ where: { id: userId }, select: { gentleMoves: true } }),
      ])
      const completedAts = completedTasks.map((t) => t.completedAt!)
      return computeRewards(completedAts, new Date(), user?.gentleMoves ?? 0)
    },
  }
}
