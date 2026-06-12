import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import TaskListPane from './TaskListPane.vue'

const tasksData = ref<
  {
    id: string
    parentId: string | null
    title: string
    status: string
    resistanceResolved: boolean
    normalizedTitle: string
    createdAt: string
  }[]
>([])

const TODAY = new Date().toISOString()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/shared/api', () => ({
  useTasks: () => ({ data: tasksData, isPending: ref(false) }),
  useCreateTask: () => ({ mutateAsync: vi.fn() }),
  useAddDailyEntry: () => ({ mutateAsync: vi.fn() }),
  useCompleteTask: () => ({ mutate: vi.fn() }),
  useReopenTask: () => ({ mutate: vi.fn() }),
  useDeleteTask: () => ({ mutate: vi.fn() }),
  useResolveResistance: () => ({ mutate: vi.fn() }),
  useUpdateTask: () => ({ mutate: vi.fn() }),
}))

let wrapper: ReturnType<typeof mount> | null = null

beforeEach(() => {
  vi.clearAllMocks()
  tasksData.value = [
    {
      id: 't1',
      parentId: null,
      title: 'First',
      status: 'open',
      resistanceResolved: false,
      normalizedTitle: 'first',
      createdAt: TODAY,
    },
    {
      id: 't2',
      parentId: null,
      title: 'Second',
      status: 'open',
      resistanceResolved: false,
      normalizedTitle: 'second',
      createdAt: TODAY,
    },
  ]
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('TaskListPane', () => {
  it('renders a card per root task', () => {
    wrapper = mount(TaskListPane)
    expect(wrapper.findAllComponents({ name: 'TaskCard' })).toHaveLength(2)
  })

  it('marks the selected task card', () => {
    wrapper = mount(TaskListPane, { props: { selectedId: 't2' } })
    const cards = wrapper.findAllComponents({ name: 'TaskCard' })
    expect(cards[0]!.props('selected')).toBe(false)
    expect(cards[1]!.props('selected')).toBe(true)
  })
})
