import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import FrequentPage from './FrequentPage.vue'

const mockCreateTask = vi.fn()
const mockAddEntry = vi.fn()
const frequentData = ref<{ normalizedTitle: string; title: string; undoneDays: number }[]>([])
const isPending = ref(false)
const mockInvalidate = vi.fn()

vi.mock('@pinia/colada', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@pinia/colada')>()
  return {
    ...actual,
    useQueryCache: () => ({ invalidateQueries: mockInvalidate }),
  }
})

vi.mock('@/shared/api', () => ({
  useFrequent: () => ({ data: frequentData, isPending }),
  useCreateTask: () => ({ mutateAsync: mockCreateTask }),
  useAddDailyEntry: () => ({ mutateAsync: mockAddEntry }),
  todayDate: '2026-06-06',
}))

beforeEach(() => {
  vi.clearAllMocks()
  frequentData.value = []
  isPending.value = false
})

describe('FrequentPage', () => {
  it('renders title from i18n', () => {
    expect(mount(FrequentPage).find('h1').text()).toContain('Частые')
  })

  it('shows empty state when no frequent tasks', () => {
    expect(mount(FrequentPage).text()).toContain('Нет повторяющихся задач')
  })

  it('shows loading state', () => {
    isPending.value = true
    expect(mount(FrequentPage).text()).toContain('Загрузка')
  })

  it('renders frequent task rows', () => {
    frequentData.value = [{ normalizedTitle: 'buy milk', title: 'Buy milk', undoneDays: 3 }]
    expect(mount(FrequentPage).text()).toContain('Buy milk')
  })

  it('calls createTask then addEntry on re-add click', async () => {
    frequentData.value = [{ normalizedTitle: 'buy milk', title: 'Buy milk', undoneDays: 3 }]
    mockCreateTask.mockResolvedValueOnce({ id: 't-new', title: 'Buy milk' })
    mockAddEntry.mockResolvedValueOnce({ id: 'e-new' })

    const wrapper = mount(FrequentPage)
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockCreateTask).toHaveBeenCalledWith({ title: 'Buy milk' })
    expect(mockAddEntry).toHaveBeenCalledWith('t-new')
  })

  it('invalidates frequent cache after re-add', async () => {
    frequentData.value = [{ normalizedTitle: 'buy milk', title: 'Buy milk', undoneDays: 3 }]
    mockCreateTask.mockResolvedValueOnce({ id: 't-new', title: 'Buy milk' })
    mockAddEntry.mockResolvedValueOnce({ id: 'e-new' })

    const wrapper = mount(FrequentPage)
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(mockInvalidate).toHaveBeenCalledWith({ key: ['frequent'] })
  })
})
