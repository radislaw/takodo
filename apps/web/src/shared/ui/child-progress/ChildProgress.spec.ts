import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ChildProgress from './ChildProgress.vue'

describe('ChildProgress', () => {
  it('has role=progressbar with aria values', () => {
    const wrapper = mount(ChildProgress, { props: { done: 2, total: 5 } })
    expect(wrapper.attributes('role')).toBe('progressbar')
    expect(wrapper.attributes('aria-valuenow')).toBe('2')
    expect(wrapper.attributes('aria-valuemax')).toBe('5')
  })

  it('shows done/total text', () => {
    const wrapper = mount(ChildProgress, { props: { done: 2, total: 5 } })
    expect(wrapper.text()).toContain('2/5')
  })

  it('uses sage fill when not complete', () => {
    const wrapper = mount(ChildProgress, { props: { done: 1, total: 4 } })
    expect(wrapper.html()).toContain('var(--sage)')
  })

  it('uses apricot fill when complete', () => {
    const wrapper = mount(ChildProgress, { props: { done: 4, total: 4 } })
    expect(wrapper.html()).toContain('var(--apricot)')
  })
})
