import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

import FocusNowCard from './FocusNowCard.vue'

describe('FocusNowCard', () => {
  it('renders the task title and start button', () => {
    const wrapper = mount(FocusNowCard, {
      props: { title: 'Записаться к стоматологу', taskId: 't1' },
    })
    expect(wrapper.text()).toContain('Записаться к стоматологу')
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('navigates to /do with task query on click', async () => {
    const wrapper = mount(FocusNowCard, {
      props: { title: 'Задача', taskId: 't1' },
    })
    await wrapper.find('button').trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ path: '/do', query: { task: 't1' } })
  })

  it('shows all-done state without button when no title', () => {
    const wrapper = mount(FocusNowCard)
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.text()).toContain('Всё на сегодня сделано')
  })

  it('matches snapshot', () => {
    const wrapper = mount(FocusNowCard, {
      props: { title: 'Задача', taskId: 't1' },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
