import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppStatCard from './AppStatCard.vue'

describe('AppStatCard', () => {
  it('renders label and value', () => {
    const wrapper = mount(AppStatCard, { props: { label: 'Серия', value: 18 } })
    expect(wrapper.text()).toContain('Серия')
    expect(wrapper.text()).toContain('18')
  })

  it('renders string values verbatim', () => {
    const wrapper = mount(AppStatCard, { props: { label: 'Уровень', value: '1 PM' } })
    expect(wrapper.text()).toContain('1 PM')
  })

  it('renders an icon when provided', () => {
    const wrapper = mount(AppStatCard, {
      props: { label: 'Серия', value: 5, icon: 'flame' },
    })
    expect(wrapper.findComponent({ name: 'AppIcon' }).exists()).toBe(true)
  })

  it('omits the icon slot when no icon given', () => {
    const wrapper = mount(AppStatCard, { props: { label: 'XP', value: 0 } })
    expect(wrapper.findComponent({ name: 'AppIcon' }).exists()).toBe(false)
  })

  it('matches snapshot', () => {
    const wrapper = mount(AppStatCard, {
      props: { label: 'Рекорд', value: 21, icon: 'trophy' },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
