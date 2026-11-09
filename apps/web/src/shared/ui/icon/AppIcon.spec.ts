import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppIcon from './AppIcon.vue'

describe('AppIcon', () => {
  it('renders svg with correct size', () => {
    const wrapper = mount(AppIcon, { props: { name: 'check' } })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('20')
    expect(svg.attributes('height')).toBe('20')
  })

  it('renders path from IC map', () => {
    const wrapper = mount(AppIcon, { props: { name: 'plus' } })
    expect(wrapper.find('path').exists()).toBe(true)
  })

  it('is decorative by default — aria-hidden true', () => {
    const wrapper = mount(AppIcon, { props: { name: 'check' } })
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
  })

  it('gets role=img when title provided', () => {
    const wrapper = mount(AppIcon, { props: { name: 'check', title: 'Done' } })
    const svg = wrapper.find('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(wrapper.find('title').text()).toBe('Done')
  })

  it('renders inner circle for award icon', () => {
    const wrapper = mount(AppIcon, { props: { name: 'award' } })
    expect(wrapper.find('circle').exists()).toBe(true)
  })

  it('applies custom size and strokeWidth', () => {
    const wrapper = mount(AppIcon, { props: { name: 'check', size: 32, strokeWidth: 3 } })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('32')
    expect(svg.attributes('stroke-width')).toBe('3')
  })

  it('matches snapshot', () => {
    const wrapper = mount(AppIcon, { props: { name: 'check' } })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
