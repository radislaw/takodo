import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import TasksPage from './TasksPage.vue'

const mockCreateTask = vi.fn()
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
const isPending = ref(false)

const TODAY = new Date().toISOString()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/shared/api', () => ({
  useTasks: () => ({ data: tasksData, isPending }),
  useCreateTask: () => ({ mutateAsync: mockCreateTask }),
  useCompleteTask: () => ({ mutate: vi.fn() }),
  useReopenTask: () => ({ mutate: vi.fn() }),
  useDeleteTask: () => ({ mutate: vi.fn() }),
  useResolveResistance: () => ({ mutate: vi.fn() }),
  useUpdateTask: () => ({ mutate: vi.fn() }),
}))

let wrapper: ReturnType<typeof mount> | null = null

beforeEach(() => {
  vi.clearAllMocks()
  tasksData.value = []
  isPending.value = false
  document.body.style.overflow = ''
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.style.overflow = ''
})

describe('TasksPage', () => {
  it('renders title from i18n', () => {
    wrapper = mount(TasksPage)
    expect(wrapper.find('h1').text()).toContain('Задачи')
  })

  it('shows empty state when no tasks', () => {
    wrapper = mount(TasksPage)
    expect(wrapper.text()).toContain('Задач нет')
  })

  it('shows loading state', () => {
    isPending.value = true
    wrapper = mount(TasksPage)
    expect(wrapper.text()).toContain('Загрузка')
  })

  it('renders root tasks', () => {
    tasksData.value = [
      {
        id: 't1',
        parentId: null,
        title: 'Buy milk',
        status: 'open',
        resistanceResolved: false,
        normalizedTitle: 'buy milk',
        createdAt: TODAY,
      },
    ]
    wrapper = mount(TasksPage)
    expect(wrapper.text()).toContain('Buy milk')
  })

  it('does not show child tasks in flat list', () => {
    tasksData.value = [
      {
        id: 't1',
        parentId: null,
        title: 'Parent',
        status: 'open',
        resistanceResolved: false,
        normalizedTitle: 'parent',
        createdAt: TODAY,
      },
      {
        id: 't2',
        parentId: 't1',
        title: 'Child',
        status: 'open',
        resistanceResolved: false,
        normalizedTitle: 'child',
        createdAt: TODAY,
      },
    ]
    wrapper = mount(TasksPage)
    const cards = wrapper.findAllComponents({ name: 'TaskCard' })
    expect(cards).toHaveLength(1)
    expect(cards.at(0)!.props('task').id).toBe('t1')
  })

  it('shows correct child progress on root task', () => {
    tasksData.value = [
      {
        id: 't1',
        parentId: null,
        title: 'Parent',
        status: 'open',
        resistanceResolved: false,
        normalizedTitle: 'parent',
        createdAt: TODAY,
      },
      {
        id: 't2',
        parentId: 't1',
        title: 'Done child',
        status: 'done',
        resistanceResolved: false,
        normalizedTitle: 'done child',
        createdAt: TODAY,
      },
      {
        id: 't3',
        parentId: 't1',
        title: 'Open child',
        status: 'open',
        resistanceResolved: false,
        normalizedTitle: 'open child',
        createdAt: TODAY,
      },
    ]
    wrapper = mount(TasksPage)
    const card = wrapper.findComponent({ name: 'TaskCard' })
    expect(card.props('childDone')).toBe(1)
    expect(card.props('childTotal')).toBe(2)
  })

  it('groups tasks by date with today label', () => {
    tasksData.value = [
      {
        id: 't1',
        parentId: null,
        title: 'Task today',
        status: 'open',
        resistanceResolved: false,
        normalizedTitle: 'task today',
        createdAt: TODAY,
      },
    ]
    wrapper = mount(TasksPage)
    expect(wrapper.text()).toContain('Сегодня')
  })

  it('calls createTask on add button click', async () => {
    mockCreateTask.mockResolvedValueOnce({ id: 't-new', title: 'Test task' })
    wrapper = mount(TasksPage)
    await wrapper.find('input').setValue('Test task')
    await wrapper.vm.$nextTick()
    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Добавить'))
    await addBtn!.trigger('click')
    await wrapper.vm.$nextTick()
    expect(mockCreateTask).toHaveBeenCalledWith({ title: 'Test task' })
  })
})
