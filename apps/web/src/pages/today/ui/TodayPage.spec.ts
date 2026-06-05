import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import TodayPage from './TodayPage.vue'

const mockCreateTask = vi.fn()
const mockAddEntry = vi.fn()
const mockCompleteTask = vi.fn()
const mockReopenTask = vi.fn()
const mockUpdateEntry = vi.fn()
const mockRemoveEntry = vi.fn()

const dailyData = ref<
  | {
      id: string
      date: string
      createdAt: string
      entries: { id: string; taskId: string; isMIT: boolean; order: number }[]
    }
  | undefined
>(undefined)

const tasksData = ref<{ id: string; title: string; status: string }[]>([])

vi.mock('@/shared/api', () => ({
  useDailyToday: () => ({ data: dailyData, isPending: ref(false) }),
  useTasks: () => ({ data: tasksData }),
  useCreateTask: () => ({ mutateAsync: mockCreateTask }),
  useAddDailyEntry: () => ({ mutateAsync: mockAddEntry }),
  useCompleteTask: () => ({ mutate: mockCompleteTask }),
  useReopenTask: () => ({ mutate: mockReopenTask }),
  useUpdateDailyEntry: () => ({ mutateAsync: mockUpdateEntry }),
  useRemoveDailyEntry: () => ({ mutate: mockRemoveEntry }),
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

describe('TodayPage', () => {
  it('renders title from i18n', () => {
    const wrapper = mountPage()
    expect(wrapper.find('h1').text()).toContain('Сегодня')
  })

  it('shows empty state when no entries', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Список пуст')
  })

  it('renders entries when daily has entries', async () => {
    tasksData.value = [{ id: 't1', title: 'Buy milk', status: 'open' }]
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
    const input = wrapper.find('input')
    await input.setValue('Test task')
    await wrapper.vm.$nextTick()
    const buttons = wrapper.findAll('button')
    const addBtn = buttons.find((b) => b.text().includes('Добавить'))
    await addBtn?.trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockCreateTask).toHaveBeenCalledWith({ title: 'Test task' })
    expect(mockAddEntry).toHaveBeenCalledWith('t-new')
  })

  it('calls completeTask when checkbox checked for open task', async () => {
    tasksData.value = [{ id: 't1', title: 'Buy milk', status: 'open' }]
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
    tasksData.value = [{ id: 't1', title: 'Task', status: 'open' }]
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

    // trigger MIT toggle — click the zap icon button
    const buttons = wrapper.findAll('button')
    const mitBtn = buttons.find((b) => b.attributes('aria-label') === 'Главное')
    await mitBtn?.trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(wrapper.text()).toContain('Главных дел уже 3')
  })
})
