import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppLayout from './AppLayout.vue'

function makeRouter(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/today', component: { template: '<div/>' } },
      { path: '/tasks', component: { template: '<div/>' } },
      { path: '/frequent', component: { template: '<div/>' } },
      { path: '/design/ui', component: { template: '<div/>' }, meta: { chrome: false } },
    ],
  })
  router.push(path)
  return router
}

async function mountLayout(path: string) {
  const router = makeRouter(path)
  await router.isReady()
  return mount(AppLayout, { global: { plugins: [router] } })
}

describe('AppLayout', () => {
  it('shows bottom nav by default', async () => {
    const wrapper = await mountLayout('/today')
    expect(wrapper.findComponent({ name: 'AppBottomNav' }).exists()).toBe(true)
  })

  it('active tab is "today" on /today', async () => {
    const wrapper = await mountLayout('/today')
    const nav = wrapper.findComponent({ name: 'AppBottomNav' })
    expect(nav.props('modelValue')).toBe('today')
  })

  it('active tab is "tasks" on /tasks', async () => {
    const wrapper = await mountLayout('/tasks')
    const nav = wrapper.findComponent({ name: 'AppBottomNav' })
    expect(nav.props('modelValue')).toBe('tasks')
  })

  it('active tab is "frequent" on /frequent', async () => {
    const wrapper = await mountLayout('/frequent')
    const nav = wrapper.findComponent({ name: 'AppBottomNav' })
    expect(nav.props('modelValue')).toBe('frequent')
  })

  it('tab click calls router.push with correct path', async () => {
    const wrapper = await mountLayout('/today')
    const pushSpy = vi.spyOn(wrapper.vm.$router, 'push')
    const nav = wrapper.findComponent({ name: 'AppBottomNav' })
    await nav.vm.$emit('update:modelValue', 'tasks')
    expect(pushSpy).toHaveBeenCalledWith('/tasks')
  })

  it('hides nav when route.meta.chrome is false', async () => {
    const wrapper = await mountLayout('/design/ui')
    expect(wrapper.findComponent({ name: 'AppBottomNav' }).exists()).toBe(false)
  })
})
