import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppInput from './AppInput.vue'

describe('AppInput', () => {
  it('renders input by default', () => {
    const wrapper = mount(AppInput)
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(false)
  })

  it('renders textarea when multiline', () => {
    const wrapper = mount(AppInput, { props: { multiline: true } })
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('renders label and associates it with input via id', () => {
    const wrapper = mount(AppInput, { props: { label: 'Название' } })
    const label = wrapper.find('label')
    const input = wrapper.find('input')
    expect(label.exists()).toBe(true)
    expect(label.attributes('for')).toBe(input.attributes('id'))
  })

  it('shows hint when provided', () => {
    const wrapper = mount(AppInput, { props: { hint: 'Коротко и ясно' } })
    expect(wrapper.text()).toContain('Коротко и ясно')
  })

  it('shows error and sets aria-invalid', () => {
    const wrapper = mount(AppInput, { props: { error: 'Слишком длинное' } })
    expect(wrapper.text()).toContain('Слишком длинное')
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('links aria-describedby to error id', () => {
    const wrapper = mount(AppInput, { props: { error: 'Ошибка' } })
    const input = wrapper.find('input')
    const describedBy = input.attributes('aria-describedby')
    expect(describedBy).toBeTruthy()
    const errorEl = wrapper.find(`#${describedBy}`)
    expect(errorEl.exists()).toBe(true)
  })

  it('is disabled when prop set', () => {
    const wrapper = mount(AppInput, { props: { disabled: true } })
    expect((wrapper.find('input').element as HTMLInputElement).disabled).toBe(true)
  })

  it('matches snapshot', () => {
    const wrapper = mount(AppInput, { props: { label: 'Тест', placeholder: 'Введи...' } })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
