import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppSheet from './AppSheet.vue'

describe('AppSheet', () => {
  it('renders sheet container', () => {
    const wrapper = mount(AppSheet)
    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('renders title when provided', () => {
    const wrapper = mount(AppSheet, { props: { title: 'Новое дело' } })
    expect(wrapper.find('h2').text()).toBe('Новое дело')
  })

  it('renders subtitle when provided', () => {
    const wrapper = mount(AppSheet, { props: { title: 'Дело', subtitle: 'Опиши кратко' } })
    expect(wrapper.find('p').text()).toBe('Опиши кратко')
  })

  it('renders handle bar', () => {
    const wrapper = mount(AppSheet)
    const handle = wrapper.find('[aria-hidden="true"]')
    expect(handle.exists()).toBe(true)
  })

  it('renders slot content', () => {
    const wrapper = mount(AppSheet, { slots: { default: '<p>Контент</p>' } })
    expect(wrapper.text()).toContain('Контент')
  })

  it('matches snapshot', () => {
    const wrapper = mount(AppSheet, { props: { title: 'Тест' } })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
