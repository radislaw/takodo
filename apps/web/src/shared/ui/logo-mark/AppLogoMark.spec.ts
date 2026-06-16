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

  it('renders the octopus body paths and two eye rects', () => {
    const wrapper = mount(AppLogoMark)
    expect(wrapper.findAll('path').length).toBe(4)
    expect(wrapper.findAll('rect').length).toBe(2)
  })

  it('fills eyes with the theme gradient when not light', () => {
    const wrapper = mount(AppLogoMark, { props: { light: false } })
    const eyes = wrapper.findAll('rect')
    expect(eyes[0]!.attributes('fill')).toBe('var(--logo-eye-override, url(#lgm-grad))')
  })

  it('fills eyes with translucent white when light=true', () => {
    const wrapper = mount(AppLogoMark, { props: { light: true } })
    const eyes = wrapper.findAll('rect')
    expect(eyes[0]!.attributes('fill')).toBe('rgba(255,255,255,0.9)')
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
