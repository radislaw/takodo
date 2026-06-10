import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { createI18n } from 'vue-i18n'
import StreakFlame from './StreakFlame.vue'
import ru from '@/locales/ru.json'

const i18n = createI18n({ legacy: false, locale: 'ru', messages: { ru } })

function factory(props: { streak: number; shields: number; shieldUsedRecently?: boolean }) {
  return mount(StreakFlame, { props, global: { plugins: [i18n] } })
}

describe('StreakFlame', () => {
  it('renders streak day count', () => {
    const wrapper = factory({ streak: 4, shields: 0 })
    expect(wrapper.text()).toContain('Серия 4 дн.')
  })

  it('renders nothing when streak is 0', () => {
    const wrapper = factory({ streak: 0, shields: 0 })
    expect(wrapper.find('[data-test="streak-flame"]').exists()).toBe(false)
  })

  it('shows one shield pip per shield', () => {
    const wrapper = factory({ streak: 5, shields: 2 })
    expect(wrapper.findAll('[data-test="shield-pip"]')).toHaveLength(2)
  })

  it('shows no shield pips with zero shields', () => {
    const wrapper = factory({ streak: 3, shields: 0 })
    expect(wrapper.findAll('[data-test="shield-pip"]')).toHaveLength(0)
  })

  it('exposes shields count via aria-label', () => {
    const wrapper = factory({ streak: 5, shields: 1 })
    expect(wrapper.find('[data-test="shield-pips"]').attributes('aria-label')).toBe(
      'Щитов серии: 1',
    )
  })

  it('shows shield-active hint when a shield was used recently', () => {
    const wrapper = factory({ streak: 6, shields: 0, shieldUsedRecently: true })
    expect(wrapper.text()).toContain('Серия под защитой')
  })

  it('hides shield-active hint otherwise', () => {
    const wrapper = factory({ streak: 6, shields: 1 })
    expect(wrapper.text()).not.toContain('Серия под защитой')
  })
})
