// Framework-free timezone helpers for the profile settings select.
// Labels are derived (city + live UTC offset) so they stay DST-correct
// without hardcoding per-zone copy.

export const TIMEZONE_IDS = [
  'Europe/Kaliningrad',
  'Europe/Moscow',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'Asia/Magadan',
  'Asia/Kamchatka',
  'Europe/Minsk',
  'Europe/Kiev',
  'Asia/Tbilisi',
  'Asia/Yerevan',
  'Asia/Baku',
  'Asia/Tashkent',
  'Asia/Almaty',
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const

/** Browser-resolved IANA timezone, or undefined when unavailable. */
export function detectTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  } catch {
    return undefined
  }
}

/** Live UTC offset for an IANA id, e.g. "UTC+3" / "UTC-5" / "UTC". */
export function timezoneOffset(id: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: id,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date())
    const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
    return raw.replace('GMT', 'UTC') || 'UTC'
  } catch {
    return ''
  }
}

/** City segment of an IANA id with separators normalized, e.g. "New York". */
export function timezoneCity(id: string): string {
  const segment = id.split('/').pop() ?? id
  return segment.replace(/_/g, ' ')
}

/** Friendly label, e.g. "Moscow · UTC+3". UTC stays bare. */
export function formatTimezoneLabel(id: string): string {
  if (id === 'UTC') return 'UTC'
  const offset = timezoneOffset(id)
  const city = timezoneCity(id)
  return offset ? `${city} · ${offset}` : city
}
