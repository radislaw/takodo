/** Minimum full missed days that count as a "comeback" (anti-shame return state). */
export const COMEBACK_MIN_GAP_DAYS = 2

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Full days with no activity strictly between the last active day and today.
 * Both arguments are YYYY-MM-DD (UTC). Null last active day → no gap (new user).
 */
export function gapDays(lastActiveDay: string | null, today: string): number {
  if (!lastActiveDay) return 0
  const last = new Date(`${lastActiveDay}T00:00:00Z`).getTime()
  const now = new Date(`${today}T00:00:00Z`).getTime()
  return Math.max(0, Math.floor((now - last) / DAY_MS) - 1)
}

export function isComeback(gap: number): boolean {
  return gap >= COMEBACK_MIN_GAP_DAYS
}
