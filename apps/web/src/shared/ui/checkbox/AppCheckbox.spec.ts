import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppCheckbox from './AppCheckbox.vue'

describe('AppCheckbox', () => {
  it('renders a native hidden checkbox', () => {
    const wrapper = mount(AppCheckbox)
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.exists()).toBe(true)
    expect(input.classes()).toContain('sr-only')
  })

  it('is unchecked by default', () => {
    const wrapper = mount(AppCheckbox)
    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).checked).toBe(false)
  })

  it('shows check icon when checked', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: true } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('hides check icon when unchecked', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('emits update:modelValue on checkbox change', async () => {
    const wrapper = mount(AppCheckbox)
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('has min tap target via label min-height', () => {
    const wrapper = mount(AppCheckbox)
    const label = wrapper.find('label')
    expect(label.attributes('style')).toContain('44px')
  })

  it('matches snapshot', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
