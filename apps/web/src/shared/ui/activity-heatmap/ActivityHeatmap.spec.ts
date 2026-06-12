import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { createI18n } from 'vue-i18n'
import ActivityHeatmap from './ActivityHeatmap.vue'
import { todayDate } from '@/shared/api/daily'
import ru from '@/locales/ru.json'

const i18n = createI18n({ legacy: false, locale: 'ru', messages: { ru } })

interface Day {
  date: string
  count: number
  shielded?: boolean
}

function grid(days: Day[]): Day[] {
  // Pad to a whole number of 7-day columns so the layout matches the API shape.
  const padded = [...days]
  while (padded.length % 7 !== 0) padded.unshift({ date: `pad-${padded.length}`, count: 0 })
  return padded
}

function factory(props: { days: Day[]; max: number; showLabels?: boolean }) {
  return mount(ActivityHeatmap, { props, global: { plugins: [i18n] } })
}

describe('ActivityHeatmap', () => {
  it('renders one cell per day', () => {
    const days = grid(Array.from({ length: 14 }, (_, i) => ({ date: `d${i}`, count: 0 })))
    const wrapper = factory({ days, max: 0 })
    expect(wrapper.findAll('[data-test="heatmap-cell"]')).toHaveLength(14)
  })

  it('renders empty window without crashing', () => {
    const days = grid(Array.from({ length: 7 }, (_, i) => ({ date: `d${i}`, count: 0 })))
    const wrapper = factory({ days, max: 0 })
    expect(wrapper.find('[data-test="activity-heatmap"]').exists()).toBe(true)
  })

  it('applies a higher intensity level to busier days', () => {
    const days = grid([
      { date: '2024-06-01', count: 1 },
      { date: '2024-06-02', count: 8 },
    ])
    const wrapper = factory({ days, max: 8 })
    const cells = wrapper.findAll('[data-test="heatmap-cell"]')
    const busy = cells.find((c) => c.attributes('data-date') === '2024-06-02')!
    const light = cells.find((c) => c.attributes('data-date') === '2024-06-01')!
    expect(Number(busy.attributes('data-level'))).toBeGreaterThan(
      Number(light.attributes('data-level')),
    )
  })

  it('highlights today', () => {
    const td = todayDate()
    const days = grid([{ date: td, count: 1 }])
    const wrapper = factory({ days, max: 1 })
    const cell = wrapper.find(`[data-date="${td}"]`)
    expect(cell.attributes('data-today')).toBe('true')
  })

  it('marks shielded days', () => {
    const days = grid([{ date: '2024-06-04', count: 0, shielded: true }])
    const wrapper = factory({ days, max: 0 })
    const cell = wrapper.find('[data-date="2024-06-04"]')
    expect(cell.attributes('data-shielded')).toBe('true')
  })

  it('shows month labels when showLabels is true', () => {
    const days = grid(
      Array.from({ length: 7 }, (_, i) => ({ date: `2024-06-0${i + 1}`, count: 0 })),
    )
    const wrapper = factory({ days, max: 0, showLabels: true })
    expect(wrapper.find('[data-test="heatmap-months"]').exists()).toBe(true)
  })

  it('hides labels when showLabels is false', () => {
    const days = grid(
      Array.from({ length: 7 }, (_, i) => ({ date: `2024-06-0${i + 1}`, count: 0 })),
    )
    const wrapper = factory({ days, max: 0, showLabels: false })
    expect(wrapper.find('[data-test="heatmap-months"]').exists()).toBe(false)
  })
})
