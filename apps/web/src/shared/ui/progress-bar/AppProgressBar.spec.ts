import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppProgressBar from './AppProgressBar.vue'

describe('AppProgressBar', () => {
  it('has role=progressbar', () => {
    const wrapper = mount(AppProgressBar, { props: { value: 50 } })
    expect(wrapper.attributes('role')).toBe('progressbar')
  })

  it('sets aria-valuenow correctly', () => {
    const wrapper = mount(AppProgressBar, { props: { value: 75 } })
    expect(wrapper.attributes('aria-valuenow')).toBe('75')
  })

  it('sets aria-valuemin=0 and aria-valuemax=100', () => {
    const wrapper = mount(AppProgressBar, { props: { value: 50 } })
    expect(wrapper.attributes('aria-valuemin')).toBe('0')
    expect(wrapper.attributes('aria-valuemax')).toBe('100')
  })

  it('clamps fill width to 0-100%', () => {
    const wrapper = mount(AppProgressBar, { props: { value: 120 } })
    const fill = wrapper.find('.h-full')
    expect((fill.element as HTMLElement).style.width).toBe('100%')
  })

  it('applies reward fill class when reward=true', () => {
    const wrapper = mount(AppProgressBar, { props: { value: 100, reward: true } })
    const fill = wrapper.find('.h-full')
    expect(fill.classes()).toContain('fill-reward')
  })

  it('applies accent fill class by default', () => {
    const wrapper = mount(AppProgressBar, { props: { value: 50 } })
    const fill = wrapper.find('.h-full')
    expect(fill.classes()).toContain('fill-accent')
  })

  it('matches snapshot', () => {
    const wrapper = mount(AppProgressBar, { props: { value: 65 } })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
