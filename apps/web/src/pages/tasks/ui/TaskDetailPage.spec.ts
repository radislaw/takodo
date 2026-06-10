import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import TaskDetailPage from './TaskDetailPage.vue'

const mockPush = vi.fn()
const mockDelete = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'task-1' } }),
  useRouter: () => ({ push: mockPush }),
}))

const treeData = ref<{
  id: string
  parentId: string | null
  title: string
  note?: string
  status: 'open' | 'done'
  resistanceResolved: boolean
  estimateMinutes?: number
  normalizedTitle: string
  children: {
    id: string
    parentId: string | null
    title: string
    status: 'open' | 'done'
    resistanceResolved: boolean
    normalizedTitle: string
    children: never[]
  }[]
} | null>(null)

const taskListData = ref<
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
const status = ref<'pending' | 'success' | 'error'>('success')

vi.mock('@/shared/api', () => ({
  useTaskTree: () => ({ data: treeData, isPending, status }),
  useTasks: () => ({ data: taskListData }),
  useCompleteTask: () => ({ mutate: vi.fn() }),
  useReopenTask: () => ({ mutate: vi.fn() }),
  useDeleteTask: () => ({ mutate: mockDelete }),
  useResolveResistance: () => ({ mutate: vi.fn() }),
  useUpdateTask: () => ({ mutate: vi.fn() }),
  useCreateTask: () => ({ mutateAsync: vi.fn() }),
  useAddDailyEntry: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('@/shared/lib/useSuccessToast', () => ({
  useSuccessToast: () => ({ showSuccess: vi.fn(), hideSuccess: vi.fn(), key: { value: null } }),
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
    {
      id: 'child-2',
      parentId: 'task-1',
      title: 'Step two',
      status: 'done' as const,
      resistanceResolved: false,
      normalizedTitle: 'step two',
      children: [],
    },
  ],
}

let wrapper: ReturnType<typeof mount> | null = null

beforeEach(() => {
  vi.clearAllMocks()
  treeData.value = null
  taskListData.value = []
  isPending.value = false
  status.value = 'success'
  document.body.style.overflow = ''
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.style.overflow = ''
})

describe('TaskDetailPage', () => {
  it('shows loading state', () => {
    isPending.value = true
    wrapper = mount(TaskDetailPage)
    expect(wrapper.text()).toContain('Загрузка')
  })

  it('shows not found when error', () => {
    status.value = 'error'
    wrapper = mount(TaskDetailPage)
    expect(wrapper.text()).toContain('не найдена')
  })

  it('renders task title', () => {
    treeData.value = fakeTree
    wrapper = mount(TaskDetailPage)
    expect(wrapper.text()).toContain('Write tests')
  })

  it('renders children as TaskCard', () => {
    treeData.value = fakeTree
    wrapper = mount(TaskDetailPage, { attachTo: document.body })
    const cards = wrapper.findAllComponents({ name: 'TaskCard' })
    expect(cards.length).toBe(2)
  })

  it('shows AppProgressRing when children exist', () => {
    treeData.value = fakeTree
    wrapper = mount(TaskDetailPage)
    expect(wrapper.findComponent({ name: 'AppProgressRing' }).exists()).toBe(true)
  })

  it('does not show AppProgressRing when no children', () => {
    treeData.value = { ...fakeTree, children: [] }
    wrapper = mount(TaskDetailPage)
    expect(wrapper.findComponent({ name: 'AppProgressRing' }).exists()).toBe(false)
  })

  it('renders breadcrumb root when no parent', () => {
    treeData.value = fakeTree
    wrapper = mount(TaskDetailPage)
    expect(wrapper.text()).toContain('Задачи')
  })

  it('renders ancestor breadcrumb when task has parent', () => {
    treeData.value = { ...fakeTree, parentId: 'parent-1' }
    taskListData.value = [
      {
        id: 'parent-1',
        parentId: null,
        title: 'Parent task',
        status: 'open',
        resistanceResolved: false,
        normalizedTitle: 'parent task',
      },
    ]
    wrapper = mount(TaskDetailPage)
    expect(wrapper.text()).toContain('Parent task')
  })

  it('navigates to /tasks on root breadcrumb click', async () => {
    treeData.value = fakeTree
    wrapper = mount(TaskDetailPage)
    const rootBtn = wrapper.findAll('button').find((b) => b.text() === 'Задачи')
    await rootBtn!.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/tasks')
  })

  it('calls deleteTask and navigates after confirm', async () => {
    treeData.value = fakeTree
    wrapper = mount(TaskDetailPage, { attachTo: document.body })
    // open confirm sheet via delete button
    const deleteBtn = wrapper.find('[aria-label="Удалить"]')
    await deleteBtn.trigger('click')
    await wrapper.vm.$nextTick()
    // click confirm in sheet
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Удалить',
    )
    confirmBtn?.click()
    await wrapper.vm.$nextTick()
    expect(mockDelete).toHaveBeenCalledWith('task-1')
    expect(mockPush).toHaveBeenCalledWith('/tasks')
  })
})
