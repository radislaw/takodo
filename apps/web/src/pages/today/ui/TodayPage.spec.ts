import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import TodayPage from './TodayPage.vue'
import { useErrorToast } from '@/shared/lib/useErrorToast'

const mockCreateTask = vi.fn()
const mockAddEntry = vi.fn()
const mockCompleteTask = vi.fn()
const mockReopenTask = vi.fn()
const mockUpdateEntry = vi.fn()
const mockMoveToTomorrow = vi.fn()

const dailyData = ref<
  | {
      id: string
      date: string
      createdAt: string
      entries: { id: string; taskId: string; isMIT: boolean; order: number }[]
    }
  | undefined
>(undefined)

const tasksData = ref<{ id: string; parentId: string | null; title: string; status: string }[]>([])

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/shared/api', () => ({
  useDailyToday: () => ({ data: dailyData, isPending: ref(false) }),
  useTasks: () => ({ data: tasksData }),
  useCreateTask: () => ({ mutateAsync: mockCreateTask }),
  useAddDailyEntry: () => ({ mutateAsync: mockAddEntry }),
  useMoveToTomorrow: () => ({ mutateAsync: mockMoveToTomorrow }),
  useCompleteTask: () => ({ mutate: mockCompleteTask }),
  useReopenTask: () => ({ mutate: mockReopenTask }),
  useUpdateDailyEntry: () => ({ mutateAsync: mockUpdateEntry }),
  useProfile: () => ({ data: ref({ name: '', theme: 'amoled' }) }),
  useRewards: () => ({
    data: ref({
      streak: 0,
      longestStreak: 0,
      shields: 0,
      shieldUsedRecently: false,
      week: [],
      badges: [],
    }),
  }),
}))

function mountPage() {
  return mount(TodayPage, { shallow: false })
}

beforeEach(() => {
  vi.clearAllMocks()
  dailyData.value = {
    id: 'list-1',
    date: '2026-06-05',
    createdAt: '2026-06-05T00:00:00Z',
    entries: [],
  }
  tasksData.value = []
})

afterEach(() => {
  useErrorToast().hideError()
})

describe('TodayPage', () => {
  it('renders greeting section', () => {
    const wrapper = mountPage()
    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.text()).toContain('Спокойно. Шаг за шагом.')
  })

  it('shows empty state when no entries', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Список пуст')
  })

  it('renders entries when daily has entries', async () => {
    tasksData.value = [{ id: 't1', parentId: null, title: 'Buy milk', status: 'open' }]
    dailyData.value = {
      id: 'list-1',
      date: '2026-06-05',
      createdAt: '2026-06-05T00:00:00Z',
      entries: [{ id: 'e1', taskId: 't1', isMIT: false, order: 0 }],
    }
    const wrapper = mountPage()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Buy milk')
  })

  it('calls createTask then addEntry on add', async () => {
    mockCreateTask.mockResolvedValueOnce({ id: 't-new', title: 'Test task' })
    mockAddEntry.mockResolvedValueOnce({ id: 'e-new', taskId: 't-new', isMIT: false, order: 0 })

    const wrapper = mountPage()

    // Open sheet via FAB (teleported to body)
    const fab = document.body.querySelector('button[aria-label]') as HTMLButtonElement | null
    fab?.click()
    await wrapper.vm.$nextTick()

    // Fill input inside sheet
    const input = document.body.querySelector('input') as HTMLInputElement | null
    if (input) {
      input.value = 'Test task'
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
    await wrapper.vm.$nextTick()

    // Click "Добавить в список"
    const btns = Array.from(document.body.querySelectorAll('button'))
    const addBtn = btns.find((b) => b.textContent?.includes('Добавить в список'))
    addBtn?.click()
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(mockCreateTask).toHaveBeenCalledWith({ title: 'Test task' })
    expect(mockAddEntry).toHaveBeenCalledWith('t-new')
  })

  it('sheet stays open after successful add', async () => {
    mockCreateTask.mockResolvedValueOnce({ id: 't-new', title: 'Test task' })
    mockAddEntry.mockResolvedValueOnce({ id: 'e-new', taskId: 't-new', isMIT: false, order: 0 })

    const wrapper = mountPage()

    const fab = document.body.querySelector('button[aria-label]') as HTMLButtonElement | null
    fab?.click()
    await wrapper.vm.$nextTick()

    const input = document.body.querySelector('input') as HTMLInputElement | null
    if (input) {
      input.value = 'Test task'
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
    await wrapper.vm.$nextTick()

    const btns = Array.from(document.body.querySelectorAll('button'))
    const addBtn = btns.find((b) => b.textContent?.includes('Добавить в список'))
    addBtn?.click()
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    // Sheet should still be open (showSheet = true)
    const sheet = document.body.querySelector('.rounded-t-3xl')
    expect(sheet).not.toBeNull()
  })

  it('clears input text after successful add', async () => {
    mockCreateTask.mockResolvedValueOnce({ id: 't-new', title: 'Test task' })
    mockAddEntry.mockResolvedValueOnce({ id: 'e-new', taskId: 't-new', isMIT: false, order: 0 })

    const wrapper = mountPage()

    const fab = document.body.querySelector('button[aria-label]') as HTMLButtonElement | null
    fab?.click()
    await wrapper.vm.$nextTick()

    const input = document.body.querySelector('input') as HTMLInputElement | null
    if (input) {
      input.value = 'Test task'
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
    await wrapper.vm.$nextTick()

    const btns = Array.from(document.body.querySelectorAll('button'))
    const addBtn = btns.find((b) => b.textContent?.includes('Добавить в список'))
    addBtn?.click()
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    const inputAfter = document.body.querySelector('input') as HTMLInputElement | null
    expect(inputAfter?.value ?? '').toBe('')
  })

  it('shows error toast when add fails', async () => {
    mockCreateTask.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mountPage()

    const fab = document.body.querySelector('button[aria-label]') as HTMLButtonElement | null
    fab?.click()
    await wrapper.vm.$nextTick()

    const input = document.body.querySelector('input') as HTMLInputElement | null
    if (input) {
      input.value = 'Test task'
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
    await wrapper.vm.$nextTick()

    const btns = Array.from(document.body.querySelectorAll('button'))
    const addBtn = btns.find((b) => b.textContent?.includes('Добавить в список'))
    addBtn?.click()
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    const { key } = useErrorToast()
    expect(key.value).toBe('errors.addFailed')
  })

  it('shows MIT counter when entries exist', async () => {
    tasksData.value = [{ id: 't1', parentId: null, title: 'Task', status: 'open' }]
    dailyData.value = {
      id: 'list-1',
      date: '2026-06-05',
      createdAt: '2026-06-05T00:00:00Z',
      entries: [{ id: 'e1', taskId: 't1', isMIT: true, order: 0 }],
    }
    const wrapper = mountPage()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('1/3')
  })

  it('MIT counter shows 0/3 when no MIT set', async () => {
    tasksData.value = [{ id: 't1', parentId: null, title: 'Task', status: 'open' }]
    dailyData.value = {
      id: 'list-1',
      date: '2026-06-05',
      createdAt: '2026-06-05T00:00:00Z',
      entries: [{ id: 'e1', taskId: 't1', isMIT: false, order: 0 }],
    }
    const wrapper = mountPage()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('0/3')
  })

  it('calls completeTask when checkbox checked for open task', async () => {
    tasksData.value = [{ id: 't1', parentId: null, title: 'Buy milk', status: 'open' }]
    dailyData.value = {
      id: 'list-1',
      date: '2026-06-05',
      createdAt: '2026-06-05T00:00:00Z',
      entries: [{ id: 'e1', taskId: 't1', isMIT: false, order: 0 }],
    }
    const wrapper = mountPage()
    await wrapper.vm.$nextTick()

    const checkbox = wrapper.findComponent({ name: 'AppCheckbox' })
    await checkbox.vm.$emit('update:modelValue', true)
    expect(mockCompleteTask).toHaveBeenCalledWith('t1')
  })

  it('shows MIT limit toast when updateEntry throws mit_limit', async () => {
    tasksData.value = [{ id: 't1', parentId: null, title: 'Task', status: 'open' }]
    dailyData.value = {
      id: 'list-1',
      date: '2026-06-05',
      createdAt: '2026-06-05T00:00:00Z',
      entries: [{ id: 'e1', taskId: 't1', isMIT: false, order: 0 }],
    }
    const mitErr = Object.assign(new Error('MIT limit'), { code: 'mit_limit' })
    mockUpdateEntry.mockRejectedValueOnce(mitErr)

    const wrapper = mountPage()
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('button')
    const mitBtn = buttons.find((b) => b.attributes('aria-label') === 'Главное')
    await mitBtn?.trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(wrapper.text()).toContain('Главных дел уже 3')
  })

  it('does not render Do-mode entry button (entry point is on task cards)', async () => {
    tasksData.value = [{ id: 't1', parentId: null, title: 'Task', status: 'open' }]
    dailyData.value = {
      id: 'list-1',
      date: '2026-06-05',
      createdAt: '2026-06-05T00:00:00Z',
      entries: [{ id: 'e1', taskId: 't1', isMIT: false, order: 0 }],
    }
    const wrapper = mountPage()
    await wrapper.vm.$nextTick()

    const doBtn = wrapper.findAll('button').find((b) => b.text().includes('Что сейчас?'))
    expect(doBtn).toBeUndefined()
  })

  it('calls moveToTomorrow with entryId and taskId', async () => {
    tasksData.value = [{ id: 't1', parentId: null, title: 'Task 1', status: 'open' }]
    dailyData.value = {
      id: 'list-1',
      date: '2026-06-05',
      createdAt: '2026-06-05T00:00:00Z',
      entries: [{ id: 'e1', taskId: 't1', isMIT: false, order: 0 }],
    }
    mockMoveToTomorrow.mockResolvedValueOnce({})

    const wrapper = mountPage()
    await wrapper.vm.$nextTick()

    const arrowBtn = wrapper.find('[aria-label="На завтра"]')
    await arrowBtn.trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(mockMoveToTomorrow).toHaveBeenCalledWith({ entryId: 'e1', taskId: 't1' })
  })
})
