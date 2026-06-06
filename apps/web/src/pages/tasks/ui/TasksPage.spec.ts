import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  }[]
>([])
const isPending = ref(false)

vi.mock('@/shared/api', () => ({
  useTasks: () => ({ data: tasksData, isPending }),
  useCreateTask: () => ({ mutateAsync: mockCreateTask }),
  useCompleteTask: () => ({ mutate: vi.fn() }),
  useReopenTask: () => ({ mutate: vi.fn() }),
  useDeleteTask: () => ({ mutate: vi.fn() }),
  useResolveResistance: () => ({ mutate: vi.fn() }),
  useUpdateTask: () => ({ mutate: vi.fn() }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  tasksData.value = []
  isPending.value = false
})

describe('TasksPage', () => {
  it('renders title from i18n', () => {
    expect(mount(TasksPage).find('h1').text()).toContain('Задачи')
  })

  it('shows empty state when no tasks', () => {
    expect(mount(TasksPage).text()).toContain('Задач нет')
  })

  it('shows loading state', () => {
    isPending.value = true
    expect(mount(TasksPage).text()).toContain('Загрузка')
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
      },
    ]
    expect(mount(TasksPage).text()).toContain('Buy milk')
  })

  it('does not render child tasks as roots', () => {
    tasksData.value = [
      {
        id: 't1',
        parentId: null,
        title: 'Parent',
        status: 'open',
        resistanceResolved: false,
        normalizedTitle: 'parent',
      },
      {
        id: 't2',
        parentId: 't1',
        title: 'Child',
        status: 'open',
        resistanceResolved: false,
        normalizedTitle: 'child',
      },
    ]
    const rootNodes = mount(TasksPage).findAllComponents({ name: 'TaskTreeNode' })
    expect(rootNodes).toHaveLength(1)
  })

  it('calls createTask on add button click', async () => {
    mockCreateTask.mockResolvedValueOnce({ id: 't-new', title: 'Test task' })
    const wrapper = mount(TasksPage)
    await wrapper.find('input').setValue('Test task')
    await wrapper.vm.$nextTick()
    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Добавить'))
    await addBtn!.trigger('click')
    await wrapper.vm.$nextTick()
    expect(mockCreateTask).toHaveBeenCalledWith({ title: 'Test task' })
  })
})
