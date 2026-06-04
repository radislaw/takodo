import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppBadge from './AppBadge.vue'

describe('AppBadge', () => {
  it('renders streak variant by default', () => {
    const wrapper = mount(AppBadge, { slots: { default: '7 дн.' } })
    expect(wrapper.classes()).toContain('bg-apricot-tint')
    expect(wrapper.classes()).toContain('text-apricot-deep')
  })

  it('renders done variant', () => {
    const wrapper = mount(AppBadge, {
      props: { variant: 'done' },
      slots: { default: 'Выполнено' },
    })
    expect(wrapper.classes()).toContain('bg-done-tint')
    expect(wrapper.classes()).toContain('text-done')
  })

  it('renders gentle variant', () => {
    const wrapper = mount(AppBadge, { props: { variant: 'gentle' } })
    expect(wrapper.classes()).toContain('bg-gentle-tint')
  })

  it('renders softrose variant', () => {
    const wrapper = mount(AppBadge, { props: { variant: 'softrose' } })
    expect(wrapper.classes()).toContain('bg-softrose-tint')
  })

  it('renders slot content', () => {
    const wrapper = mount(AppBadge, { slots: { default: 'Серия 7 дн.' } })
    expect(wrapper.text()).toContain('Серия 7 дн.')
  })

  it('matches snapshot', () => {
    const wrapper = mount(AppBadge, {
      props: { variant: 'streak' },
      slots: { default: '7 дн.' },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
