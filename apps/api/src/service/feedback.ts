import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'

type GetUserId = () => Promise<string>

const KINDS = new Set(['review', 'wish', 'support'])

export function buildFeedbackHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async FeedbackApi_create(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const body = req.body as { kind: string; message: string; rating?: number }

      if (!KINDS.has(body.kind))
        return reply.code(400).send({
          code: 'invalid_kind',
          message: 'kind must be one of "review" | "wish" | "support".',
        })

      const row = await prisma.feedback.create({
        data: {
          userId,
          kind: body.kind,
          message: body.message,
          ...(body.rating !== undefined ? { rating: body.rating } : {}),
        },
      })

      return reply.code(200).send({
        id: row.id,
        kind: row.kind,
        message: row.message,
        ...(row.rating != null ? { rating: row.rating } : {}),
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      })
    },
  }
}
