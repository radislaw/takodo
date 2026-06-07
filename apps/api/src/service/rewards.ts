import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { computeRewards } from '../domain/rewards.js'

type GetUserId = () => Promise<string>

export function buildRewardsHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Rewards_get(_req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId()
      const completedTasks = await prisma.task.findMany({
        where: { userId, status: 'done', completedAt: { not: null } },
        select: { completedAt: true },
      })
      const completedAts = completedTasks.map((t) => t.completedAt!)
      return computeRewards(completedAts, new Date())
    },
  }
}
