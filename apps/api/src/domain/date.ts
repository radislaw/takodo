/** Single home for the YYYY-MM-DD (UTC) day-string conversions used across services. */

export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Client local day may differ from server UTC by ≤1 calendar day (UTC-12…UTC+14).
 * Returns the client date if valid, server today if raw is absent, null if too far off.
 */
export function resolveClientDate(raw: string | undefined): string | null {
  const serverToday = toDateStr(new Date())
  if (!raw) return serverToday
  const diff = Math.abs(parseDate(raw).getTime() - parseDate(serverToday).getTime())
  if (Number.isNaN(diff) || diff > DAY_MS) return null
  return raw
}
