import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { isThemeUnlocked, themeUnlockLevel } from '../domain/unlocks.js'
import { getUserLevel } from './xp.js'

type GetUserId = () => Promise<string>

export function buildProfileHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Me_get(_req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId()
      const user = await prisma.user.findUnique({ where: { id: userId } })
      return {
        name: user?.name ?? '',
        theme: user?.theme ?? 'light',
        notifMorning: user?.notifMorning ?? true,
        notifEvening: user?.notifEvening ?? true,
      }
    },

    async Me_update(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const body = req.body as {
        name?: string
        theme?: string
        notifMorning?: boolean
        notifEvening?: boolean
      }

      // Level-1 themes skip the level computation entirely.
      if (body.theme !== undefined && themeUnlockLevel(body.theme) > 1) {
        const level = await getUserLevel(prisma, userId)
        if (!isThemeUnlocked(body.theme, level)) {
          return reply.code(403).send({
            code: 'theme_locked',
            message: `Theme "${body.theme}" unlocks at level ${themeUnlockLevel(body.theme)}`,
          })
        }
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.theme !== undefined ? { theme: body.theme } : {}),
          ...(body.notifMorning !== undefined ? { notifMorning: body.notifMorning } : {}),
          ...(body.notifEvening !== undefined ? { notifEvening: body.notifEvening } : {}),
        },
      })
      return {
        name: user.name,
        theme: user.theme,
        notifMorning: user.notifMorning,
        notifEvening: user.notifEvening,
      }
    },
  }
}
