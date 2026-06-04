import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppChip from './AppChip.vue'

describe('AppChip', () => {
  it('renders a button', () => {
    const wrapper = mount(AppChip, { props: { label: 'Дом' } })
    expect(wrapper.element.tagName).toBe('BUTTON')
  })

  it('has aria-pressed=false when inactive', () => {
    const wrapper = mount(AppChip, { props: { label: 'Дом', active: false } })
    expect(wrapper.attributes('aria-pressed')).toBe('false')
  })

  it('has aria-pressed=true when active', () => {
    const wrapper = mount(AppChip, { props: { label: 'Дом', active: true } })
    expect(wrapper.attributes('aria-pressed')).toBe('true')
  })

  it('emits click on press', async () => {
    const wrapper = mount(AppChip, { props: { label: 'Дом' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('renders dot when dotColor provided', () => {
    const wrapper = mount(AppChip, {
      props: { label: 'Дом', dotColor: 'var(--cat-sage)' },
    })
    const dot = wrapper.find('span')
    expect(dot.attributes('style')).toContain('var(--cat-sage)')
  })

  it('renders slot content', () => {
    const wrapper = mount(AppChip, { slots: { default: 'Работа' } })
    expect(wrapper.text()).toBe('Работа')
  })

  it('matches snapshot', () => {
    const wrapper = mount(AppChip, { props: { label: 'Дом', active: false } })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
