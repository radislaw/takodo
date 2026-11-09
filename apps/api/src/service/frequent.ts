import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { listFrequent } from '../ops/frequent.js'
import type { GetUserId } from '../auth/guard.js'

export function buildFrequentHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Frequent_list(req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId(req)
      const query = req.query as { minDays?: string }
      const minDays = query.minDays !== undefined ? parseInt(query.minDays, 10) : 1
      return listFrequent(prisma, userId, minDays)
    },
  }
}
