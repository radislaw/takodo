/** Single home for the YYYY-MM-DD (UTC) day-string conversions used across services. */

export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}
