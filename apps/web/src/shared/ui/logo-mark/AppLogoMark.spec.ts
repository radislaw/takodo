import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppLogoMark from './AppLogoMark.vue'

describe('AppLogoMark', () => {
  it('renders svg with correct size', () => {
    const wrapper = mount(AppLogoMark)
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('28')
    expect(svg.attributes('height')).toBe('28')
  })

  it('renders 3 paths', () => {
    const wrapper = mount(AppLogoMark)
    expect(wrapper.findAll('path').length).toBe(3)
  })

  it('uses dark stroke for bottom path when not light', () => {
    const wrapper = mount(AppLogoMark, { props: { light: false } })
    const paths = wrapper.findAll('path')
    expect(paths[0]!.attributes('stroke')).toBe('#2C3A33')
  })

  it('uses light transparent stroke when light=true', () => {
    const wrapper = mount(AppLogoMark, { props: { light: true } })
    const paths = wrapper.findAll('path')
    expect(paths[0]!.attributes('stroke')).toBe('rgba(255,255,255,.3)')
  })

  it('applies custom size', () => {
    const wrapper = mount(AppLogoMark, { props: { size: 40 } })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('40')
  })

  it('matches snapshot', () => {
    const wrapper = mount(AppLogoMark)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
