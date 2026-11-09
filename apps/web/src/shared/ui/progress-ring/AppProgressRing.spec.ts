import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppProgressRing from './AppProgressRing.vue'

describe('AppProgressRing', () => {
  it('has role=progressbar', () => {
    const wrapper = mount(AppProgressRing, { props: { done: 3, total: 6 } })
    expect(wrapper.attributes('role')).toBe('progressbar')
  })

  it('sets aria-valuenow to done value', () => {
    const wrapper = mount(AppProgressRing, { props: { done: 4, total: 6 } })
    expect(wrapper.attributes('aria-valuenow')).toBe('4')
  })

  it('sets aria-valuemax to total', () => {
    const wrapper = mount(AppProgressRing, { props: { done: 4, total: 6 } })
    expect(wrapper.attributes('aria-valuemax')).toBe('6')
  })

  it('shows done/total text', () => {
    const wrapper = mount(AppProgressRing, { props: { done: 2, total: 5 } })
    expect(wrapper.text()).toContain('2/5')
  })

  it('uses apricot fill at 100%', () => {
    const wrapper = mount(AppProgressRing, { props: { done: 6, total: 6 } })
    expect(wrapper.attributes('style')).toContain('var(--apricot)')
  })

  it('uses sage fill when not complete', () => {
    const wrapper = mount(AppProgressRing, { props: { done: 3, total: 6 } })
    expect(wrapper.attributes('style')).toContain('var(--sage)')
  })

  it('renders slot content as caption', () => {
    const wrapper = mount(AppProgressRing, {
      props: { done: 3, total: 6 },
      slots: { default: 'за день' },
    })
    expect(wrapper.text()).toContain('за день')
  })

  it('matches snapshot', () => {
    const wrapper = mount(AppProgressRing, { props: { done: 4, total: 6 } })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
