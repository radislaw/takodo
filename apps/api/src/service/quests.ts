import type { FastifyRequest, FastifyReply } from 'fastify'
import type { Prisma, PrismaClient, QuestClaim } from '@prisma/client'
import {
  selectDailyQuests,
  questProgress,
  rollTier,
  TIER_XP,
  type QuestDef,
  type DayStats,
} from '../domain/quests.js'
import { gapDays, isComeback } from '../domain/comeback.js'

type GetUserId = () => Promise<string>
type Db = PrismaClient | Prisma.TransactionClient

function dateToString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

async function loadDayStats(db: Db, userId: string, dateStr: string): Promise<DayStats> {
  const dayStart = parseDate(dateStr)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  const noon = new Date(dayStart.getTime() + 12 * 60 * 60 * 1000)

  const [doneToday, entriesToday, mitCompletedToday] = await Promise.all([
    db.task.findMany({
      where: { userId, status: 'done', completedAt: { gte: dayStart, lt: dayEnd } },
      select: { completedAt: true },
    }),
    db.dailyEntry.count({
      where: { dailyList: { userId, date: dayStart } },
    }),
    db.dailyEntry.count({
      where: { isMIT: true, task: { status: 'done' }, dailyList: { userId, date: dayStart } },
    }),
  ])

  return {
    completedToday: doneToday.length,
    completedBeforeNoon: doneToday.filter((t) => t.completedAt! < noon).length,
    entriesToday,
    mitCompletedToday,
  }
}

/** Comeback day → the easy quest is force-included. Stable within the day: only pre-today completions count. */
async function isComebackDay(db: Db, userId: string, dateStr: string): Promise<boolean> {
  const last = await db.task.findFirst({
    where: { userId, status: 'done', completedAt: { not: null, lt: parseDate(dateStr) } },
    orderBy: { completedAt: 'desc' },
    select: { completedAt: true },
  })
  const lastDay = last?.completedAt ? dateToString(last.completedAt) : null
  return isComeback(gapDays(lastDay, dateStr))
}

function toQuestShape(quest: QuestDef, progress: number, claim: QuestClaim | null) {
  return {
    id: quest.id,
    target: quest.target,
    progress,
    done: progress >= quest.target,
    claimed: claim !== null,
    ...(claim ? { tier: claim.tier, xp: claim.xp } : {}),
  }
}

type ClaimOutcome =
  | { status: 'already_claimed' }
  | { status: 'not_done' }
  | { status: 'ok'; claim: QuestClaim; progress: number }

export function buildQuestsHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Quests_list(_req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId()
      const today = dateToString(new Date())

      const [comeback, stats, claims] = await Promise.all([
        isComebackDay(prisma, userId, today),
        loadDayStats(prisma, userId, today),
        prisma.questClaim.findMany({ where: { userId, date: parseDate(today) } }),
      ])
      const quests = selectDailyQuests(userId, today, comeback)

      return quests.map((q) =>
        toQuestShape(q, questProgress(q, stats), claims.find((c) => c.questId === q.id) ?? null),
      )
    },

    async Quests_claim(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const { id } = req.params as { id: string }
      const today = dateToString(new Date())
      const comeback = await isComebackDay(prisma, userId, today)
      const quest = selectDailyQuests(userId, today, comeback).find((q) => q.id === id)

      if (!quest) {
        return reply.status(404).send({ code: 'not_found', message: 'Quest not in today set' })
      }

      const date = parseDate(today)
      let outcome: ClaimOutcome
      try {
        outcome = await prisma.$transaction(async (tx): Promise<ClaimOutcome> => {
          const existing = await tx.questClaim.findUnique({
            where: { userId_date_questId: { userId, date, questId: id } },
          })
          if (existing) return { status: 'already_claimed' }

          const stats = await loadDayStats(tx, userId, today)
          const progress = questProgress(quest, stats)
          if (progress < quest.target) return { status: 'not_done' }

          const tier = rollTier(Math.random())
          const claim = await tx.questClaim.create({
            data: { userId, date, questId: id, tier, xp: TIER_XP[tier] },
          })
          return { status: 'ok', claim, progress }
        })
      } catch (error) {
        // Unique constraint race: a parallel claim won — report as already claimed.
        if ((error as { code?: string }).code === 'P2002') {
          return reply
            .status(409)
            .send({ code: 'already_claimed', message: 'Quest already claimed' })
        }
        throw error
      }

      if (outcome.status === 'already_claimed') {
        return reply.status(409).send({ code: 'already_claimed', message: 'Quest already claimed' })
      }
      if (outcome.status === 'not_done') {
        return reply.status(409).send({ code: 'quest_not_done', message: 'Quest is not done yet' })
      }

      return toQuestShape(quest, outcome.progress, outcome.claim)
    },
  }
}
