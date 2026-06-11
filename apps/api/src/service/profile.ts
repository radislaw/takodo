import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { computeXPFromTotals, computeLevel } from '../domain/rewards.js'
import { isThemeUnlocked, themeUnlockLevel } from '../domain/unlocks.js'

type GetUserId = () => Promise<string>

async function getUserLevel(prisma: PrismaClient, userId: string): Promise<number> {
  const [taskTotals, mitCompletions, questXp] = await Promise.all([
    prisma.task.aggregate({
      where: { userId, status: 'done', completedAt: { not: null } },
      _count: { _all: true },
      _sum: { pomodoros: true },
    }),
    prisma.dailyEntry.count({
      where: { isMIT: true, dailyList: { userId }, task: { status: 'done' } },
    }),
    prisma.questClaim.aggregate({ _sum: { xp: true }, where: { userId } }),
  ])
  const xp =
    computeXPFromTotals(taskTotals._count._all, taskTotals._sum.pomodoros ?? 0, mitCompletions) +
    (questXp._sum.xp ?? 0)
  return computeLevel(xp)
}

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
