import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppLayout from './AppLayout.vue'

vi.mock('@/shared/api', () => ({
  useProfile: () => ({ data: ref({ name: '', theme: 'amoled' }) }),
  useUpdateProfile: () => ({ mutate: vi.fn() }),
  useRewards: () => ({
    data: ref({ streak: 6, shields: 1, shieldUsedRecently: false, week: [], badges: [] }),
  }),
}))

function makeRouter(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/today', component: { template: '<div/>' } },
      { path: '/tasks', component: { template: '<div/>' } },
      { path: '/rewards', component: { template: '<div/>' } },
      { path: '/profile', component: { template: '<div/>' } },
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

  it('active tab is "rewards" on /rewards', async () => {
    const wrapper = await mountLayout('/rewards')
    const nav = wrapper.findComponent({ name: 'AppBottomNav' })
    expect(nav.props('modelValue')).toBe('rewards')
  })

  it('active tab is "profile" on /profile', async () => {
    const wrapper = await mountLayout('/profile')
    const nav = wrapper.findComponent({ name: 'AppBottomNav' })
    expect(nav.props('modelValue')).toBe('profile')
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

  it('renders sidebar with desktop-only visibility classes', async () => {
    const wrapper = await mountLayout('/today')
    const sidebar = wrapper.findComponent({ name: 'AppSidebar' })
    expect(sidebar.exists()).toBe(true)
    expect(sidebar.classes()).toContain('hidden')
    expect(sidebar.classes()).toContain('lg:flex')
  })

  it('bottom nav has lg:hidden class', async () => {
    const wrapper = await mountLayout('/today')
    const nav = wrapper.findComponent({ name: 'AppBottomNav' })
    expect(nav.classes()).toContain('lg:hidden')
  })

  it('hides sidebar when route.meta.chrome is false', async () => {
    const wrapper = await mountLayout('/design/ui')
    expect(wrapper.findComponent({ name: 'AppSidebar' }).exists()).toBe(false)
  })

  it('sidebar gets main items without profile and profile as footer item', async () => {
    const wrapper = await mountLayout('/today')
    const sidebar = wrapper.findComponent({ name: 'AppSidebar' })
    const items = sidebar.props('items') as { id: string }[]
    expect(items.map((i) => i.id)).toEqual(['today', 'tasks', 'frequent', 'rewards'])
    expect((sidebar.props('footerItem') as { id: string }).id).toBe('profile')
  })

  it('sidebar receives streak data from rewards', async () => {
    const wrapper = await mountLayout('/today')
    const sidebar = wrapper.findComponent({ name: 'AppSidebar' })
    expect(sidebar.props('streak')).toBe(6)
    expect(sidebar.props('shields')).toBe(1)
  })

  it('sidebar tab change calls router.push', async () => {
    const wrapper = await mountLayout('/today')
    const pushSpy = vi.spyOn(wrapper.vm.$router, 'push')
    const sidebar = wrapper.findComponent({ name: 'AppSidebar' })
    await sidebar.vm.$emit('update:modelValue', 'rewards')
    expect(pushSpy).toHaveBeenCalledWith('/rewards')
  })
})
