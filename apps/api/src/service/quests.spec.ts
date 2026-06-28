import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient, QuestClaim } from '@prisma/client'
import { buildApp } from '../app.js'
import { selectDailyQuests, TIER_XP, EASY_QUEST_ID } from '../domain/quests.js'

const prisma = mockDeep<PrismaClient>()
const getUserId = vi.fn().mockResolvedValue('user-1')

const today = new Date().toISOString().slice(0, 10)
const todayQuests = selectDailyQuests('user-1', today)
const firstQuest = todayQuests[0]!

interface QuestShape {
  id: string
  target: number
  progress: number
  done: boolean
  claimed: boolean
  tier?: string
  xp?: number
}

function mockStats(opts: {
  completed?: number
  mit?: number
  entries?: number
  beforeNoon?: number
}) {
  const completed = opts.completed ?? 0
  const beforeNoon = opts.beforeNoon ?? 0
  prisma.task.findMany.mockResolvedValue(
    Array.from({ length: completed }, (_, i) => ({
      completedAt: new Date(`${today}T${i < beforeNoon ? '09' : '15'}:00:00Z`),
    })) as never,
  )
  prisma.dailyEntry.count.mockImplementation(((args: { where?: { isMIT?: boolean } }) =>
    Promise.resolve(args?.where?.isMIT ? (opts.mit ?? 0) : (opts.entries ?? 0))) as never)
}

function mockLastCompletionDaysAgo(days: number) {
  prisma.task.findFirst.mockResolvedValue({
    completedAt: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
  } as never)
}

function makeClaim(questId: string, overrides: Partial<QuestClaim> = {}): QuestClaim {
  return {
    id: 'claim-1',
    userId: 'user-1',
    date: new Date(`${today}T00:00:00Z`),
    questId,
    tier: 'common',
    xp: 10,
    createdAt: new Date(),
    ...overrides,
  }
}

describe('Quests routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    mockReset(prisma)
    getUserId.mockResolvedValue('user-1')
    prisma.questClaim.findMany.mockResolvedValue([])
    prisma.task.findFirst.mockResolvedValue(null)
    prisma.$transaction.mockImplementation((async (fn: (tx: PrismaClient) => unknown) =>
      fn(prisma)) as never)
    mockStats({})
    app = buildApp({ prisma, getUserId })
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
    vi.restoreAllMocks()
  })

  describe('GET /quests', () => {
    it('returns the 3 deterministic quests for today', async () => {
      const res = await app.inject({ method: 'GET', url: '/quests' })
      expect(res.statusCode).toBe(200)
      const body = res.json() as QuestShape[]
      expect(body).toHaveLength(3)
      expect(body.map((q) => q.id)).toEqual(todayQuests.map((q) => q.id))
    })

    it('reports zero progress with no activity', async () => {
      const res = await app.inject({ method: 'GET', url: '/quests' })
      const body = res.json() as QuestShape[]
      for (const q of body) {
        expect(q.progress).toBe(0)
        expect(q.done).toBe(false)
        expect(q.claimed).toBe(false)
      }
    })

    it('reports done when progress reaches target', async () => {
      mockStats({ completed: 5, mit: 3, entries: 5, beforeNoon: 5 })
      const res = await app.inject({ method: 'GET', url: '/quests' })
      const body = res.json() as QuestShape[]
      for (const q of body) {
        expect(q.progress).toBe(q.target)
        expect(q.done).toBe(true)
      }
    })

    it('force-includes the easy quest after a 2+ day gap (comeback)', async () => {
      mockLastCompletionDaysAgo(5)
      const res = await app.inject({ method: 'GET', url: '/quests' })
      const body = res.json() as QuestShape[]
      expect(body.map((q) => q.id)).toEqual(
        selectDailyQuests('user-1', today, true).map((q) => q.id),
      )
      expect(body.some((q) => q.id === EASY_QUEST_ID)).toBe(true)
    })

    it('keeps the natural set when last completion was yesterday', async () => {
      mockLastCompletionDaysAgo(1)
      const res = await app.inject({ method: 'GET', url: '/quests' })
      const body = res.json() as QuestShape[]
      expect(body.map((q) => q.id)).toEqual(todayQuests.map((q) => q.id))
    })

    it('uses the client-provided date for day stats (timezone east of UTC)', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const res = await app.inject({ method: 'GET', url: `/quests?date=${tomorrow}` })
      expect(res.statusCode).toBe(200)
      expect(prisma.dailyEntry.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dailyList: expect.objectContaining({ date: new Date(`${tomorrow}T00:00:00.000Z`) }),
          }) as unknown,
        }),
      )
    })

    it('rejects a date more than 1 day away from server today with 400', async () => {
      const farPast = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const res = await app.inject({ method: 'GET', url: `/quests?date=${farPast}` })
      expect(res.statusCode).toBe(400)
      expect((res.json() as { code: string }).code).toBe('invalid_date')
    })

    it('marks claimed quests with tier and xp', async () => {
      const questId = firstQuest.id
      prisma.questClaim.findMany.mockResolvedValue([makeClaim(questId, { tier: 'rare', xp: 25 })])
      const res = await app.inject({ method: 'GET', url: '/quests' })
      const body = res.json() as QuestShape[]
      const claimed = body.find((q) => q.id === questId)!
      expect(claimed.claimed).toBe(true)
      expect(claimed.tier).toBe('rare')
      expect(claimed.xp).toBe(25)
    })
  })

  describe('POST /quests/:id/claim', () => {
    it('rejects a quest not in today set with 404', async () => {
      const notToday = ['complete_1', 'complete_2', 'complete_3', 'complete_mit', 'add_3'].find(
        (id) => !todayQuests.some((q) => q.id === id),
      )!
      const res = await app.inject({ method: 'POST', url: `/quests/${notToday}/claim` })
      expect(res.statusCode).toBe(404)
      expect((res.json() as { code: string }).code).toBe('not_found')
    })

    it('rejects an unfinished quest with 409 quest_not_done', async () => {
      prisma.questClaim.findUnique.mockResolvedValue(null)
      const res = await app.inject({
        method: 'POST',
        url: `/quests/${firstQuest.id}/claim`,
      })
      expect(res.statusCode).toBe(409)
      expect((res.json() as { code: string }).code).toBe('quest_not_done')
      expect(prisma.questClaim.create).not.toHaveBeenCalled()
    })

    it('rejects an already claimed quest with 409 already_claimed', async () => {
      mockStats({ completed: 5, mit: 3, entries: 5, beforeNoon: 5 })
      prisma.questClaim.findUnique.mockResolvedValue(makeClaim(firstQuest.id))
      const res = await app.inject({
        method: 'POST',
        url: `/quests/${firstQuest.id}/claim`,
      })
      expect(res.statusCode).toBe(409)
      expect((res.json() as { code: string }).code).toBe('already_claimed')
      expect(prisma.questClaim.create).not.toHaveBeenCalled()
    })

    it('claims a finished quest, rolls tier and awards xp', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99) // epic
      mockStats({ completed: 5, mit: 3, entries: 5, beforeNoon: 5 })
      prisma.questClaim.findUnique.mockResolvedValue(null)
      const quest = firstQuest
      prisma.questClaim.create.mockResolvedValue(
        makeClaim(quest.id, { tier: 'epic', xp: TIER_XP.epic }),
      )

      const res = await app.inject({ method: 'POST', url: `/quests/${quest.id}/claim` })
      expect(res.statusCode).toBe(200)
      const body = res.json() as QuestShape
      expect(body.id).toBe(quest.id)
      expect(body.claimed).toBe(true)
      expect(body.done).toBe(true)
      expect(body.tier).toBe('epic')
      expect(body.xp).toBe(TIER_XP.epic)
      expect(prisma.questClaim.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          questId: quest.id,
          tier: 'epic',
          xp: TIER_XP.epic,
        }) as unknown,
      })
    })

    it('allows claiming the easy quest on a comeback day', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1)
      mockLastCompletionDaysAgo(5)
      mockStats({ completed: 5, mit: 3, entries: 5, beforeNoon: 5 })
      prisma.questClaim.findUnique.mockResolvedValue(null)
      prisma.questClaim.create.mockResolvedValue(makeClaim(EASY_QUEST_ID))

      const res = await app.inject({ method: 'POST', url: `/quests/${EASY_QUEST_ID}/claim` })
      expect(res.statusCode).toBe(200)
      expect((res.json() as QuestShape).id).toBe(EASY_QUEST_ID)
    })

    it('claims against the client-provided date', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const quests = selectDailyQuests('user-1', yesterday)
      mockStats({ completed: 5, mit: 3, entries: 5, beforeNoon: 5 })
      // mockStats stamps completions in *today's* morning, but this claim queries `yesterday`:
      // loadDayStats counts before-noon against yesterday's noon, so re-stamp them in yesterday's
      // morning. Otherwise the test flakes on days whose quest seed puts `before_noon` first.
      prisma.task.findMany.mockResolvedValue(
        Array.from({ length: 5 }, () => ({
          completedAt: new Date(`${yesterday}T09:00:00Z`),
        })) as never,
      )
      prisma.questClaim.findUnique.mockResolvedValue(null)
      prisma.questClaim.create.mockResolvedValue(makeClaim(quests[0]!.id))

      const res = await app.inject({
        method: 'POST',
        url: `/quests/${quests[0]!.id}/claim?date=${yesterday}`,
      })
      expect(res.statusCode).toBe(200)
      expect(prisma.questClaim.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ date: new Date(`${yesterday}T00:00:00.000Z`) }) as unknown,
      })
    })

    it('rejects a claim date outside the ±1 day window with 400', async () => {
      const farFuture = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const res = await app.inject({
        method: 'POST',
        url: `/quests/${firstQuest.id}/claim?date=${farFuture}`,
      })
      expect(res.statusCode).toBe(400)
      expect((res.json() as { code: string }).code).toBe('invalid_date')
    })

    it('runs the claim inside a transaction', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1)
      mockStats({ completed: 5, mit: 3, entries: 5, beforeNoon: 5 })
      prisma.questClaim.findUnique.mockResolvedValue(null)
      prisma.questClaim.create.mockResolvedValue(makeClaim(firstQuest.id))

      await app.inject({ method: 'POST', url: `/quests/${firstQuest.id}/claim` })
      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })
})
