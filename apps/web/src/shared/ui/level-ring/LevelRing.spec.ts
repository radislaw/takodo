import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { createI18n } from 'vue-i18n'
import LevelRing from './LevelRing.vue'
import ru from '@/locales/ru.json'

const i18n = createI18n({ legacy: false, locale: 'ru', messages: { ru } })

function factory(props: { level: number; xp: number }) {
  return mount(LevelRing, { props, global: { plugins: [i18n] } })
}

describe('LevelRing', () => {
  it('displays level number', () => {
    const wrapper = factory({ level: 3, xp: 400 })
    expect(wrapper.find('[data-test="level-number"]').text()).toBe('3')
  })

  it('displays xp value', () => {
    const wrapper = factory({ level: 3, xp: 450 })
    expect(wrapper.find('[data-test="xp-value"]').text()).toContain('450')
  })

  it('has accessible aria-label with level', () => {
    const wrapper = factory({ level: 5, xp: 2500 })
    expect(wrapper.attributes('aria-label')).toContain('5')
  })

  it('renders progress ring svg', () => {
    const wrapper = factory({ level: 1, xp: 50 })
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
