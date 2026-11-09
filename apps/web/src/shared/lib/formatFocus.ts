import type { Composer } from 'vue-i18n'

type T = Composer['t']

export function formatFocusDuration(seconds: number, t: T): string {
  const totalMinutes = Math.floor(seconds / 60)
  if (totalMinutes < 60) {
    return t('time.min', { n: totalMinutes })
  }
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return m > 0 ? t('time.hourMin', { h, m }) : t('time.hour', { n: h })
}
