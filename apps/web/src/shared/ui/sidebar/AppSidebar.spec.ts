import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppSidebar from './AppSidebar.vue'

const items = [
  { id: 'today', icon: 'home' as const, label: 'Сегодня' },
  { id: 'tasks', icon: 'layers' as const, label: 'Задачи' },
  { id: 'rewards', icon: 'award' as const, label: 'Награды' },
]

const footerItem = { id: 'profile', icon: 'settings' as const, label: 'Я' }

function make(props: Record<string, unknown> = {}) {
  return mount(AppSidebar, {
    props: { modelValue: 'today', items, ...props },
  })
}

describe('AppSidebar', () => {
  it('renders a nav element with aria-label', () => {
    const wrapper = make()
    const nav = wrapper.find('nav')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')).toBeTruthy()
  })

  it('renders a button per main item', () => {
    const wrapper = make()
    expect(wrapper.findAll('button')).toHaveLength(3)
  })

  it('renders footer item as an extra button', () => {
    const wrapper = make({ footerItem })
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(4)
    expect(buttons[3]!.text()).toContain('Я')
  })

  it('marks active item with aria-current=page and active classes', () => {
    const wrapper = make({ modelValue: 'tasks' })
    const buttons = wrapper.findAll('button')
    expect(buttons[1]!.attributes('aria-current')).toBe('page')
    expect(buttons[1]!.classes()).toContain('bg-sage-tint')
    expect(buttons[0]!.attributes('aria-current')).toBeUndefined()
    expect(buttons[0]!.classes()).not.toContain('bg-sage-tint')
  })

  it('emits update:modelValue on main item click', async () => {
    const wrapper = make()
    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['tasks'])
  })

  it('emits update:modelValue on footer item click', async () => {
    const wrapper = make({ footerItem })
    await wrapper.findAll('button')[3]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['profile'])
  })

  it('renders StreakFlame only when streak > 0', () => {
    const without = make()
    expect(without.findComponent({ name: 'StreakFlame' }).exists()).toBe(false)

    const withStreak = make({ streak: 6, shields: 1 })
    const flame = withStreak.findComponent({ name: 'StreakFlame' })
    expect(flame.exists()).toBe(true)
    expect(flame.props('streak')).toBe(6)
    expect(flame.props('shields')).toBe(1)
  })

  it('renders the two-tone wordmark', () => {
    const wrapper = make()
    expect(wrapper.text()).toContain('Too')
  })

  it('matches snapshot', () => {
    const wrapper = make({ footerItem, streak: 6, shields: 2 })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
