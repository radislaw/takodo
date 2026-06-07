import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import TaskDetailPage from './TaskDetailPage.vue'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'task-1' } }),
  useRouter: () => ({ push: mockPush }),
}))

const treeData = ref<{
  id: string
  parentId: string | null
  title: string
  note?: string
  status: string
  resistanceResolved: boolean
  estimateMinutes?: number
  normalizedTitle: string
  children: {
    id: string
    parentId: string | null
    title: string
    status: string
    resistanceResolved: boolean
    normalizedTitle: string
    children: never[]
  }[]
} | null>(null)
const isPending = ref(false)
const status = ref<'pending' | 'success' | 'error'>('success')

vi.mock('@/shared/api', () => ({
  useTaskTree: () => ({ data: treeData, isPending, status }),
  useCompleteTask: () => ({ mutate: vi.fn() }),
  useReopenTask: () => ({ mutate: vi.fn() }),
  useDeleteTask: () => ({ mutate: vi.fn() }),
  useResolveResistance: () => ({ mutate: vi.fn() }),
  useUpdateTask: () => ({ mutate: vi.fn() }),
  useCreateTask: () => ({ mutateAsync: vi.fn() }),
}))

const fakeTree = {
  id: 'task-1',
  parentId: null,
  title: 'Write tests',
  note: 'Important',
  status: 'open' as const,
  resistanceResolved: false,
  estimateMinutes: undefined,
  normalizedTitle: 'write tests',
  children: [
    {
      id: 'child-1',
      parentId: 'task-1',
      title: 'Step one',
      status: 'open' as const,
      resistanceResolved: false,
      normalizedTitle: 'step one',
      children: [],
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  treeData.value = null
  isPending.value = false
  status.value = 'success'
})

describe('TaskDetailPage', () => {
  it('shows loading state', () => {
    isPending.value = true
    expect(mount(TaskDetailPage).text()).toContain('Загрузка')
  })

  it('shows not found when error', () => {
    status.value = 'error'
    expect(mount(TaskDetailPage).text()).toContain('не найдена')
  })

  it('renders task title', () => {
    treeData.value = fakeTree
    expect(mount(TaskDetailPage).text()).toContain('Write tests')
  })

  it('renders children', () => {
    treeData.value = fakeTree
    expect(mount(TaskDetailPage).text()).toContain('Step one')
  })

  it('back button navigates to /tasks', async () => {
    treeData.value = fakeTree
    const wrapper = mount(TaskDetailPage)
    const backBtn = wrapper.findAll('button').find((b) => b.text().includes('Задачи'))
    await backBtn!.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/tasks')
  })
})
