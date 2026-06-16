import type { PrismaClient } from '@prisma/client'
import { computeXPFromTotals, computeLevel } from '../domain/rewards.js'

/**
 * Aggregate-based XP/level — the cheap path for handlers that need the level
 * without the full reward summary (which scans completion rows for the streak).
 * Must stay in XP-parity with Rewards_get (same filters, same quest XP source).
 */
export async function getUserXP(prisma: PrismaClient, userId: string): Promise<number> {
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
  return (
    computeXPFromTotals(taskTotals._count._all, taskTotals._sum.pomodoros ?? 0, mitCompletions) +
    (questXp._sum.xp ?? 0)
  )
}

export async function getUserLevel(prisma: PrismaClient, userId: string): Promise<number> {
  return computeLevel(await getUserXP(prisma, userId))
}

/**
 * Level + first-task flag in one aggregate pass — for the theme-unlock gate,
 * where first-task themes (dark, high-contrast-dark) depend on the completed
 * count rather than the level. Reuses the same XP aggregates as getUserXP.
 */
export async function getUserProgress(
  prisma: PrismaClient,
  userId: string,
): Promise<{ level: number; firstTaskDone: boolean }> {
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
  const completedCount = taskTotals._count._all
  const xp =
    computeXPFromTotals(completedCount, taskTotals._sum.pomodoros ?? 0, mitCompletions) +
    (questXp._sum.xp ?? 0)
  return { level: computeLevel(xp), firstTaskDone: completedCount >= 1 }
}
