import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppBottomNav from './AppBottomNav.vue'

const items = [
  { id: 'home', icon: 'home' as const, label: 'Сегодня' },
  { id: 'tasks', icon: 'layers' as const, label: 'Задачи' },
  { id: 'rewards', icon: 'award' as const, label: 'Награды' },
]

describe('AppBottomNav', () => {
  it('renders a nav element with aria-label', () => {
    const wrapper = mount(AppBottomNav, {
      props: { modelValue: 'home', items },
    })
    const nav = wrapper.find('nav')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')).toBeTruthy()
  })

  it('renders correct number of buttons', () => {
    const wrapper = mount(AppBottomNav, {
      props: { modelValue: 'home', items },
    })
    expect(wrapper.findAll('button')).toHaveLength(3)
  })

  it('marks active item with aria-current=page', () => {
    const wrapper = mount(AppBottomNav, {
      props: { modelValue: 'tasks', items },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[1]!.attributes('aria-current')).toBe('page')
    expect(buttons[0]!.attributes('aria-current')).toBeUndefined()
  })

  it('emits update:modelValue on click', async () => {
    const wrapper = mount(AppBottomNav, {
      props: { modelValue: 'home', items },
    })
    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['tasks'])
  })

  it('matches snapshot', () => {
    const wrapper = mount(AppBottomNav, {
      props: { modelValue: 'home', items },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
