import { describe, it, expect } from 'vitest'
import { createI18n } from 'vue-i18n'
import ru from '@/locales/ru.json'
import { ruPlural } from './plural'
import type { MessageSchema } from './index'

const i18n = createI18n<[MessageSchema], 'ru'>({
  legacy: false,
  locale: 'ru',
  fallbackLocale: 'ru',
  messages: { ru },
  pluralRules: { ru: ruPlural },
  datetimeFormats: {
    ru: { short: { year: 'numeric', month: 'short', day: 'numeric' } },
  },
  numberFormats: {
    ru: { decimal: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 } },
  },
})

const { t, d, n } = i18n.global

describe('ruPlural', () => {
  it('0 → нет задач (index 0)', () => {
    expect(t('task.count', 0)).toBe('нет задач')
  })
  it('1 → 1 задача (index 1)', () => {
    expect(t('task.count', 1)).toBe('1 задача')
  })
  it('3 → 3 задачи (index 2)', () => {
    expect(t('task.count', 3)).toBe('3 задачи')
  })
  it('5 → 5 задач (index 3)', () => {
    expect(t('task.count', 5)).toBe('5 задач')
  })
  it('11 → 11 задач (teen)', () => {
    expect(t('task.count', 11)).toBe('11 задач')
  })
  it('21 → 21 задача (ends in 1, not teen)', () => {
    expect(t('task.count', 21)).toBe('21 задача')
  })
})

describe('key resolution', () => {
  it('resolves a11y.mainNav', () => {
    expect(t('a11y.mainNav')).toBe('Основная навигация')
  })

  it('resolves progressRing.default', () => {
    expect(t('progressRing.default')).toBe('сегодня')
  })

  it('interpolates progressRing.aria', () => {
    expect(t('progressRing.aria', { done: 3, total: 6 })).toBe('3 из 6')
  })
})

describe('datetime format', () => {
  it('renders ru.short without throwing', () => {
    const result = d(new Date('2026-01-15'), 'short', 'ru')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('number format', () => {
  it('renders ru.decimal without throwing', () => {
    const result = n(1234.5, 'decimal', 'ru')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
