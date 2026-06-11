export type QuestKind = 'complete' | 'complete_mit' | 'add_entries' | 'complete_before_noon'

export interface QuestDef {
  id: string
  kind: QuestKind
  target: number
}

export interface DayStats {
  completedToday: number
  mitCompletedToday: number
  entriesToday: number
  completedBeforeNoon: number
}

export type QuestTier = 'common' | 'rare' | 'epic'

export const TIER_XP: Record<QuestTier, number> = {
  common: 10,
  rare: 25,
  epic: 50,
}

export const QUEST_POOL: QuestDef[] = [
  { id: 'complete_1', kind: 'complete', target: 1 },
  { id: 'complete_2', kind: 'complete', target: 2 },
  { id: 'complete_3', kind: 'complete', target: 3 },
  { id: 'complete_mit', kind: 'complete_mit', target: 1 },
  { id: 'add_3', kind: 'add_entries', target: 3 },
  { id: 'before_noon', kind: 'complete_before_noon', target: 1 },
]

const DAILY_QUEST_COUNT = 3

function fnv1a(str: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic 3 quests for a user+date — same input always yields the same set. */
export function selectDailyQuests(userId: string, date: string): QuestDef[] {
  const rand = mulberry32(fnv1a(`${userId}:${date}`))
  const shuffled = QUEST_POOL.map((q) => ({ q, sort: rand() }))
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.q)
  return shuffled.slice(0, DAILY_QUEST_COUNT)
}

export function questProgress(quest: QuestDef, stats: DayStats): number {
  const raw = {
    complete: stats.completedToday,
    complete_mit: stats.mitCompletedToday,
    add_entries: stats.entriesToday,
    complete_before_noon: stats.completedBeforeNoon,
  }[quest.kind]
  return Math.min(raw, quest.target)
}

/** Tier roll: 70% common, 25% rare, 5% epic. `rand` ∈ [0, 1). */
export function rollTier(rand: number): QuestTier {
  if (rand < 0.7) return 'common'
  if (rand < 0.95) return 'rare'
  return 'epic'
}
