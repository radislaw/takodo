import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppButton from './AppButton.vue'

describe('AppButton', () => {
  it('renders a native button element', () => {
    const wrapper = mount(AppButton)
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
  })

  it('is not disabled by default', () => {
    const wrapper = mount(AppButton)
    expect(wrapper.attributes('disabled')).toBeUndefined()
  })

  it('disables when prop set', () => {
    const wrapper = mount(AppButton, { props: { disabled: true } })
    expect((wrapper.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('emits click event', async () => {
    const wrapper = mount(AppButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(AppButton, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('renders slot content', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Готово' } })
    expect(wrapper.text()).toBe('Готово')
  })

  it('applies aria-label for icon shapes', () => {
    const wrapper = mount(AppButton, {
      props: { shape: 'fab', ariaLabel: 'Добавить задачу' },
    })
    expect(wrapper.attributes('aria-label')).toBe('Добавить задачу')
  })

  it('matches snapshot', () => {
    const wrapper = mount(AppButton, { props: { variant: 'primary' }, slots: { default: 'OK' } })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
