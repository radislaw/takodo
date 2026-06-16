import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskCard from './TaskCard.vue'
import { useUndoDelete } from '@/shared/lib/useUndoDelete'

const mockPush = vi.fn()
const mockComplete = vi.fn()
const mockReopen = vi.fn()
const mockDelete = vi.fn()
const mockResolve = vi.fn()
const mockUpdate = vi.fn()
const mockCelebrate = vi.fn()
const mockAddToToday = vi.fn()
const mockShowSuccess = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/shared/api', () => ({
  useCompleteTask: () => ({ mutate: mockComplete }),
  useReopenTask: () => ({ mutate: mockReopen }),
  useDeleteTask: () => ({ mutate: mockDelete }),
  useResolveResistance: () => ({ mutate: mockResolve }),
  useUpdateTask: () => ({ mutate: mockUpdate }),
  useAddDailyEntry: () => ({ mutateAsync: mockAddToToday }),
}))

vi.mock('@/shared/lib/useSuccessToast', () => ({
  useSuccessToast: () => ({
    showSuccess: mockShowSuccess,
    hideSuccess: vi.fn(),
    key: { value: null },
  }),
}))

vi.mock('@/shared/lib/useReward', () => ({
  useReward: () => ({ celebrate: mockCelebrate, hide: vi.fn(), isVisible: { value: false } }),
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
  useUndoDelete().dismiss()
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

  it('applies selected styling when selected', () => {
    const w1 = mount(TaskCard, { props: { task: openTask, selected: true } })
    expect(w1.element.firstElementChild?.className).toContain('bg-sage-tint')
    expect(w1.element.firstElementChild?.className).toContain('border-sage')

    const w2 = mount(TaskCard, { props: { task: openTask } })
    expect(w2.element.firstElementChild?.className).toContain('surface-card')
    expect(w2.element.firstElementChild?.className).not.toContain('bg-sage-tint')

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

  it('schedules delete (does not call deleteTask immediately)', async () => {
    vi.useFakeTimers()
    wrapper = mount(TaskCard, { props: { task: openTask }, attachTo: document.body })
    await wrapper.find('[aria-label="Действия"]').trigger('click')
    await wrapper.vm.$nextTick()
    const deleteBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Удалить'),
    )
    deleteBtn?.click()
    await wrapper.vm.$nextTick()
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Удалить',
    )
    confirmBtn?.click()
    await wrapper.vm.$nextTick()
    // not yet — pending 5s
    expect(mockDelete).not.toHaveBeenCalled()
    // after 5s → fires
    vi.advanceTimersByTime(5000)
    expect(mockDelete).toHaveBeenCalledWith('t1')
    vi.useRealTimers()
  })

  it('undo cancels scheduled delete', async () => {
    vi.useFakeTimers()
    wrapper = mount(TaskCard, { props: { task: openTask }, attachTo: document.body })
    await wrapper.find('[aria-label="Действия"]').trigger('click')
    await wrapper.vm.$nextTick()
    const deleteBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Удалить'),
    )
    deleteBtn?.click()
    await wrapper.vm.$nextTick()
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Удалить',
    )
    confirmBtn?.click()
    await wrapper.vm.$nextTick()
    // cancel via undo
    useUndoDelete().pending.value!.cancel()
    vi.advanceTimersByTime(5000)
    expect(mockDelete).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('shows resistance badge when resistanceResolved is false', () => {
    wrapper = mount(TaskCard, { props: { task: openTask }, attachTo: document.body })
    const badge = wrapper.find('[aria-label="Есть сопротивление — нажми, чтобы преодолеть"]')
    expect(badge.exists()).toBe(true)
  })

  it('hides resistance badge when resistanceResolved is true', () => {
    const resolvedTask = { ...openTask, resistanceResolved: true }
    wrapper = mount(TaskCard, { props: { task: resolvedTask }, attachTo: document.body })
    const badge = wrapper.find('[aria-label="Есть сопротивление — нажми, чтобы преодолеть"]')
    expect(badge.exists()).toBe(false)
  })

  it('clicking resistance badge calls resolveResistance and celebrate', async () => {
    wrapper = mount(TaskCard, { props: { task: openTask }, attachTo: document.body })
    const badge = wrapper.find('[aria-label="Есть сопротивление — нажми, чтобы преодолеть"]')
    await badge.trigger('click')
    expect(mockResolve).toHaveBeenCalledWith('t1')
    expect(mockCelebrate).toHaveBeenCalled()
  })

  it('inline "+ в сегодня" icon calls addDailyEntry and shows success toast', async () => {
    mockAddToToday.mockResolvedValueOnce({})
    wrapper = mount(TaskCard, { props: { task: openTask }, attachTo: document.body })

    await wrapper.find('[aria-label="+ в сегодня"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(mockAddToToday).toHaveBeenCalledWith('t1')
    expect(mockShowSuccess).toHaveBeenCalledWith('success.addedToToday')
  })

  it('hides resolve resistance from the action sheet (badge is the only path)', async () => {
    wrapper = mount(TaskCard, { props: { task: openTask }, attachTo: document.body })
    await wrapper.find('[aria-label="Действия"]').trigger('click')
    await wrapper.vm.$nextTick()
    const resolveBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Я могу это'),
    )
    expect(resolveBtn).toBeUndefined()
  })
})
