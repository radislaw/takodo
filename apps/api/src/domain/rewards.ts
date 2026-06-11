export interface CompletedTaskInfo {
  completedAt: Date
  pomodoros: number
}

export interface DayActivityResult {
  date: string
  active: boolean
  shielded?: boolean
}

export interface BadgeResult {
  id: string
  earned: boolean
  remaining?: number
}

export interface RewardsSummaryResult {
  streak: number
  longestStreak: number
  shields: number
  shieldUsedRecently: boolean
  week: DayActivityResult[]
  badges: BadgeResult[]
  xp: number
  level: number
}

const SHIELD_EARN_EVERY = 5
const SHIELD_CAP = 2
const SHIELD_RECENT_DAYS = 7

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function mondayOf(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d
}

interface StreakReplay {
  streak: number
  longest: number
  shields: number
  shieldedDays: Set<string>
}

/**
 * Shield-aware calendar replay from the first active day to nowDate.
 * Active day → streak grows; every 5th streak day earns a shield (cap 2).
 * Inactive past day → consumes a shield (streak preserved) or resets the streak.
 * Today inactive → grace: the day is still in progress, nothing is consumed.
 */
function replayStreak(activeDays: Set<string>, nowDate: Date): StreakReplay {
  const result: StreakReplay = { streak: 0, longest: 0, shields: 0, shieldedDays: new Set() }
  if (activeDays.size === 0) return result

  const todayStr = toDateStr(nowDate)
  const firstDay = [...activeDays].sort()[0]!
  const cursor = new Date(firstDay + 'T00:00:00Z')
  const end = new Date(todayStr + 'T00:00:00Z')

  let streak = 0
  let shields = 0
  while (cursor.getTime() <= end.getTime()) {
    const dayStr = toDateStr(cursor)
    if (activeDays.has(dayStr)) {
      streak++
      if (streak % SHIELD_EARN_EVERY === 0 && shields < SHIELD_CAP) shields++
      result.longest = Math.max(result.longest, streak)
    } else if (dayStr !== todayStr) {
      if (shields > 0) {
        shields--
        result.shieldedDays.add(dayStr)
      } else {
        streak = 0
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  result.streak = streak
  result.shields = shields
  return result
}

export function computeXP(tasks: CompletedTaskInfo[], mitCompletions: number): number {
  const base = tasks.length * 10
  const mit = mitCompletions * 5
  const pomodoro = tasks.reduce((sum, t) => sum + t.pomodoros, 0) * 5
  return base + mit + pomodoro
}

export function computeLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

export function computeRewards(
  completedTasks: CompletedTaskInfo[],
  nowDate: Date,
  gentleMoves = 0,
  mitCompletions = 0,
  questXp = 0,
): RewardsSummaryResult {
  const activeDays = new Set(completedTasks.map((t) => toDateStr(t.completedAt)))
  const { streak, longest, shields, shieldedDays } = replayStreak(activeDays, nowDate)

  const todayMs = new Date(toDateStr(nowDate) + 'T00:00:00Z').getTime()
  const shieldUsedRecently = [...shieldedDays].some(
    (day) => (todayMs - new Date(day + 'T00:00:00Z').getTime()) / 86400000 <= SHIELD_RECENT_DAYS,
  )

  // week: Mon–Sun of the ISO week containing nowDate
  const monday = mondayOf(nowDate)
  const week: DayActivityResult[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setUTCDate(d.getUTCDate() + i)
    const dateStr = toDateStr(d)
    return {
      date: dateStr,
      active: activeDays.has(dateStr),
      ...(shieldedDays.has(dateStr) ? { shielded: true } : {}),
    }
  })

  const totalCompleted = completedTasks.length
  const streakBadge = (id: string, threshold: number): BadgeResult => ({
    id,
    earned: longest >= threshold,
    ...(longest < threshold ? { remaining: Math.max(0, threshold - streak) } : {}),
  })
  const badges: BadgeResult[] = [
    { id: 'first_step', earned: totalCompleted >= 1 },
    streakBadge('streak_5', 5),
    streakBadge('streak_7', 7),
    streakBadge('streak_21', 21),
    {
      id: 'gentle_mode',
      earned: gentleMoves >= 3,
      ...(gentleMoves < 3 ? { remaining: 3 - gentleMoves } : {}),
    },
  ]

  const xp = computeXP(completedTasks, mitCompletions) + questXp
  const level = computeLevel(xp)

  return { streak, longestStreak: longest, shields, shieldUsedRecently, week, badges, xp, level }
}
