import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'

type GetUserId = () => Promise<string>

export function buildProfileHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Me_get(_req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId()
      const user = await prisma.user.findUnique({ where: { id: userId } })
      return { name: user?.name ?? '', theme: user?.theme ?? 'light' }
    },

    async Me_update(req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId()
      const body = req.body as { name?: string; theme?: string }
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.theme !== undefined ? { theme: body.theme } : {}),
        },
      })
      return { name: user.name, theme: user.theme }
    },
  }
}
