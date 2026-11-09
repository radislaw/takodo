import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppScreenHeader from './AppScreenHeader.vue'

describe('AppScreenHeader', () => {
  it('renders the title in an h1', () => {
    const wrapper = mount(AppScreenHeader, { props: { title: 'Задачи' } })
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('Задачи')
  })

  it('renders a subtitle only when provided', () => {
    const without = mount(AppScreenHeader, { props: { title: 'Частые' } })
    expect(without.find('p').exists()).toBe(false)

    const withSub = mount(AppScreenHeader, { props: { title: 'Частые', subtitle: 'Подсказка' } })
    expect(withSub.find('p').text()).toBe('Подсказка')
  })

  it('is sticky by default and static when sticky=false', () => {
    const def = mount(AppScreenHeader, { props: { title: 'A' } })
    expect(def.find('header').classes()).toContain('sticky')

    const flat = mount(AppScreenHeader, { props: { title: 'A', sticky: false } })
    expect(flat.find('header').classes()).not.toContain('sticky')
  })

  it('shows a back button only when showBack and emits back on click', async () => {
    const noBack = mount(AppScreenHeader, { props: { title: 'A' } })
    expect(noBack.find('button').exists()).toBe(false)

    const wrapper = mount(AppScreenHeader, { props: { title: 'A', showBack: true } })
    const btn = wrapper.find('button')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-label')).toBeTruthy()
    await btn.trigger('click')
    expect(wrapper.emitted('back')).toHaveLength(1)
  })
})
