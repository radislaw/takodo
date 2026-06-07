export interface DayActivityResult {
  date: string
  active: boolean
}

export interface BadgeResult {
  id: string
  earned: boolean
  remaining?: number
}

export interface RewardsSummaryResult {
  streak: number
  longestStreak: number
  week: DayActivityResult[]
  badges: BadgeResult[]
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function mondayOf(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d
}

export function computeRewards(completedAts: Date[], nowDate: Date): RewardsSummaryResult {
  const activeDays = new Set(completedAts.map(toDateStr))

  // streak: consecutive days back from today (grace: today may still be in progress)
  const todayStr = toDateStr(nowDate)
  const streakStart = new Date(nowDate)
  streakStart.setUTCHours(0, 0, 0, 0)
  if (!activeDays.has(todayStr)) {
    streakStart.setUTCDate(streakStart.getUTCDate() - 1)
  }
  let streak = 0
  const cursor = new Date(streakStart)
  while (activeDays.has(toDateStr(cursor))) {
    streak++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  // longestStreak: scan sorted active days
  const sortedDays = [...activeDays].sort()
  let longest = streak
  let current = 0
  let prev: string | null = null
  for (const day of sortedDays) {
    if (prev) {
      const diff =
        (new Date(day + 'T00:00:00Z').getTime() - new Date(prev + 'T00:00:00Z').getTime()) /
        86400000
      current = diff === 1 ? current + 1 : 1
    } else {
      current = 1
    }
    longest = Math.max(longest, current)
    prev = day
  }

  // week: Mon–Sun of the ISO week containing nowDate
  const monday = mondayOf(nowDate)
  const week: DayActivityResult[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setUTCDate(d.getUTCDate() + i)
    const dateStr = toDateStr(d)
    return { date: dateStr, active: activeDays.has(dateStr) }
  })

  const totalCompleted = completedAts.length
  const badges: BadgeResult[] = [
    { id: 'first_step', earned: totalCompleted >= 1 },
    {
      id: 'streak_5',
      earned: longest >= 5,
      ...(longest < 5 ? { remaining: Math.max(0, 5 - streak) } : {}),
    },
    {
      id: 'streak_7',
      earned: longest >= 7,
      ...(longest < 7 ? { remaining: Math.max(0, 7 - streak) } : {}),
    },
    // TODO: track reschedule events when "gentle mode" mechanic is implemented
    { id: 'gentle_mode', earned: false },
  ]

  return { streak, longestStreak: longest, week, badges }
}
