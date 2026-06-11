import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { computeXP, computeLevel } from '../domain/rewards.js'
import { isThemeUnlocked, themeUnlockLevel } from '../domain/unlocks.js'

type GetUserId = () => Promise<string>

async function getUserLevel(prisma: PrismaClient, userId: string): Promise<number> {
  const [completedTasks, mitCompletions] = await Promise.all([
    prisma.task.findMany({
      where: { userId, status: 'done', completedAt: { not: null } },
      select: { completedAt: true, pomodoros: true },
    }),
    prisma.dailyEntry.count({
      where: { isMIT: true, dailyList: { userId }, task: { status: 'done' } },
    }),
  ])
  const tasks = completedTasks.map((t) => ({
    completedAt: t.completedAt!,
    pomodoros: t.pomodoros,
  }))
  return computeLevel(computeXP(tasks, mitCompletions))
}

export function buildProfileHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Me_get(_req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId()
      const user = await prisma.user.findUnique({ where: { id: userId } })
      return { name: user?.name ?? '', theme: user?.theme ?? 'light' }
    },

    async Me_update(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const body = req.body as { name?: string; theme?: string }

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
        },
      })
      return { name: user.name, theme: user.theme }
    },
  }
}
