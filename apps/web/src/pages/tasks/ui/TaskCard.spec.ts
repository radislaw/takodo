import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskCard from './TaskCard.vue'

const mockPush = vi.fn()
const mockComplete = vi.fn()
const mockReopen = vi.fn()
const mockDelete = vi.fn()
const mockResolve = vi.fn()
const mockUpdate = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/shared/api', () => ({
  useCompleteTask: () => ({ mutate: mockComplete }),
  useReopenTask: () => ({ mutate: mockReopen }),
  useDeleteTask: () => ({ mutate: mockDelete }),
  useResolveResistance: () => ({ mutate: mockResolve }),
  useUpdateTask: () => ({ mutate: mockUpdate }),
}))

const openTask = {
  id: 't1',
  parentId: null,
  title: 'Buy milk',
  status: 'open' as const,
  resistanceResolved: false,
  normalizedTitle: 'buy milk',
}

const doneTask = { ...openTask, status: 'done' as const }

let wrapper: ReturnType<typeof mount> | null = null

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.style.overflow = ''
})

describe('TaskCard', () => {
  it('renders task title', () => {
    wrapper = mount(TaskCard, { props: { task: openTask }, attachTo: document.body })
    expect(wrapper.text()).toContain('Buy milk')
  })

  it('shows progress only when childTotal > 0', () => {
    const w1 = mount(TaskCard, { props: { task: openTask, childDone: 2, childTotal: 5 } })
    expect(w1.text()).toContain('2/5')

    const w2 = mount(TaskCard, { props: { task: openTask, childDone: 0, childTotal: 0 } })
    expect(w2.text()).not.toContain('/')

    w1.unmount()
    w2.unmount()
  })

  it('applies strikethrough when done', () => {
    wrapper = mount(TaskCard, { props: { task: doneTask } })
    const btn = wrapper.findAll('button').find((b) => b.text().includes('Buy milk'))
    expect(btn?.classes()).toContain('line-through')
  })

  it('title button navigates to task detail', async () => {
    wrapper = mount(TaskCard, { props: { task: openTask } })
    const titleBtn = wrapper.findAll('button').find((b) => b.text() === 'Buy milk')
    await titleBtn!.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/tasks/t1')
  })

  it('calls completeTask when checkbox toggled on open task', async () => {
    wrapper = mount(TaskCard, { props: { task: openTask }, attachTo: document.body })
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)
    expect(mockComplete).toHaveBeenCalledWith('t1')
  })

  it('calls reopenTask when checkbox toggled on done task', async () => {
    wrapper = mount(TaskCard, { props: { task: doneTask }, attachTo: document.body })
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(false)
    expect(mockReopen).toHaveBeenCalledWith('t1')
  })

  it('opens action sheet on ⋯ button', async () => {
    wrapper = mount(TaskCard, { props: { task: openTask }, attachTo: document.body })
    const moreBtn = wrapper.find('[aria-label="Действия"]')
    await moreBtn.trigger('click')
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  })

  it('calls deleteTask after confirm flow', async () => {
    wrapper = mount(TaskCard, { props: { task: openTask }, attachTo: document.body })
    // open actions
    await wrapper.find('[aria-label="Действия"]').trigger('click')
    await wrapper.vm.$nextTick()
    // click delete in action sheet
    const deleteBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Удалить'),
    )
    deleteBtn?.click()
    await wrapper.vm.$nextTick()
    // confirm
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Удалить',
    )
    confirmBtn?.click()
    await wrapper.vm.$nextTick()
    expect(mockDelete).toHaveBeenCalledWith('t1')
  })
})
