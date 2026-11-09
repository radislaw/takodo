import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppToast from './AppToast.vue'

describe('AppToast', () => {
  it('has role=status for dark variant', () => {
    const wrapper = mount(AppToast)
    expect(wrapper.attributes('role')).toBe('status')
  })

  it('has role=alert for gentle variant', () => {
    const wrapper = mount(AppToast, { props: { variant: 'gentle' } })
    expect(wrapper.attributes('role')).toBe('alert')
  })

  it('has aria-live=polite for dark variant', () => {
    const wrapper = mount(AppToast)
    expect(wrapper.attributes('aria-live')).toBe('polite')
  })

  it('has aria-live=assertive for gentle variant', () => {
    const wrapper = mount(AppToast, { props: { variant: 'gentle' } })
    expect(wrapper.attributes('aria-live')).toBe('assertive')
  })

  it('applies dark classes by default', () => {
    const wrapper = mount(AppToast)
    expect(wrapper.classes()).toContain('bg-ink')
  })

  it('applies sage classes', () => {
    const wrapper = mount(AppToast, { props: { variant: 'sage' } })
    expect(wrapper.classes()).toContain('bg-sage')
  })

  it('renders slot content', () => {
    const wrapper = mount(AppToast, { slots: { default: 'Маленькая победа!' } })
    expect(wrapper.text()).toContain('Маленькая победа!')
  })

  it('matches snapshot', () => {
    const wrapper = mount(AppToast, { slots: { default: 'Задача выполнена' } })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
