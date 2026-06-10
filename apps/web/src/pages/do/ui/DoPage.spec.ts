import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import DoPage from './DoPage.vue'

const mockCompleteTask = vi.fn()
const mockPush = vi.fn()
const routeQuery = ref<Record<string, string>>({})

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

vi.mock('@/shared/api', () => ({
  useDailyToday: () => ({ data: dailyData, isPending: ref(false) }),
  useTasks: () => ({ data: tasksData }),
  useCompleteTask: () => ({ mutateAsync: mockCompleteTask }),
  useRecordFocus: () => ({ mutate: vi.fn() }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: routeQuery.value }),
}))

function mountPage() {
  return mount(DoPage)
}

function setData(
  tasks: { id: string; title: string; status: string }[],
  entries: { taskId: string; isMIT?: boolean; order?: number }[],
) {
  tasksData.value = tasks.map((t) => ({ ...t, parentId: null }))
  dailyData.value = {
    id: 'list-1',
    date: '2026-06-10',
    createdAt: '2026-06-10T00:00:00Z',
    entries: entries.map((e, i) => ({
      id: `e-${e.taskId}`,
      taskId: e.taskId,
      isMIT: e.isMIT ?? false,
      order: e.order ?? i,
    })),
  }
}

function findButton(wrapper: ReturnType<typeof mountPage>, text: string) {
  return wrapper.findAll('button').find((b) => b.text().includes(text))
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCompleteTask.mockResolvedValue({})
  dailyData.value = undefined
  tasksData.value = []
  routeQuery.value = {}
})

describe('DoPage', () => {
  it('shows the first active task fullscreen', () => {
    setData(
      [
        { id: 't1', title: 'Wash dishes', status: 'open' },
        { id: 't2', title: 'Call mom', status: 'open' },
      ],
      [{ taskId: 't1' }, { taskId: 't2' }],
    )
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Wash dishes')
    expect(wrapper.text()).not.toContain('Call mom')
  })

  it('shows MIT task first regardless of order', () => {
    setData(
      [
        { id: 't1', title: 'Wash dishes', status: 'open' },
        { id: 't2', title: 'Call mom', status: 'open' },
      ],
      [{ taskId: 't1' }, { taskId: 't2', isMIT: true }],
    )
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Call mom')
  })

  it('skips done tasks', () => {
    setData(
      [
        { id: 't1', title: 'Wash dishes', status: 'done' },
        { id: 't2', title: 'Call mom', status: 'open' },
      ],
      [{ taskId: 't1' }, { taskId: 't2' }],
    )
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Call mom')
  })

  it('shows MIT badge for MIT entry', () => {
    setData([{ id: 't1', title: 'Wash dishes', status: 'open' }], [{ taskId: 't1', isMIT: true }])
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Главное')
  })

  it('shows remaining counter', () => {
    setData(
      [
        { id: 't1', title: 'A', status: 'open' },
        { id: 't2', title: 'B', status: 'open' },
        { id: 't3', title: 'C', status: 'open' },
      ],
      [{ taskId: 't1' }, { taskId: 't2' }, { taskId: 't3' }],
    )
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('осталось 3 дела')
  })

  it('completes current task and advances to next', async () => {
    setData(
      [
        { id: 't1', title: 'Wash dishes', status: 'open' },
        { id: 't2', title: 'Call mom', status: 'open' },
      ],
      [{ taskId: 't1' }, { taskId: 't2' }],
    )
    const wrapper = mountPage()
    await findButton(wrapper, 'Сделал')!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockCompleteTask).toHaveBeenCalledWith('t1')
    expect(wrapper.text()).toContain('Call mom')
    expect(wrapper.text()).not.toContain('Wash dishes')
  })

  it('returns task to queue when complete fails', async () => {
    mockCompleteTask.mockRejectedValueOnce(new Error('network'))
    setData([{ id: 't1', title: 'Wash dishes', status: 'open' }], [{ taskId: 't1' }])
    const wrapper = mountPage()
    await findButton(wrapper, 'Сделал')!.trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Wash dishes')
  })

  it('moves current task to the end of the queue on skip', async () => {
    setData(
      [
        { id: 't1', title: 'Wash dishes', status: 'open' },
        { id: 't2', title: 'Call mom', status: 'open' },
      ],
      [{ taskId: 't1' }, { taskId: 't2' }],
    )
    const wrapper = mountPage()
    await findButton(wrapper, 'Не сейчас')!.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Call mom')

    await findButton(wrapper, 'Не сейчас')!.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Wash dishes')
  })

  it('hides skip button when only one task left', () => {
    setData([{ id: 't1', title: 'Wash dishes', status: 'open' }], [{ taskId: 't1' }])
    const wrapper = mountPage()
    expect(findButton(wrapper, 'Не сейчас')).toBeUndefined()
  })

  it('shows all-done state when queue is empty', () => {
    setData([{ id: 't1', title: 'Wash dishes', status: 'done' }], [{ taskId: 't1' }])
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Всё на сегодня сделано')
  })

  it('navigates back to today from all-done state', async () => {
    setData([], [])
    const wrapper = mountPage()
    await findButton(wrapper, 'К списку')!.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/today')
  })

  it('starts with the task from the query param even when another is MIT', () => {
    routeQuery.value = { task: 't2' }
    setData(
      [
        { id: 't1', title: 'Wash dishes', status: 'open' },
        { id: 't2', title: 'Call mom', status: 'open' },
      ],
      [{ taskId: 't1', isMIT: true }, { taskId: 't2' }],
    )
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Call mom')
    expect(wrapper.text()).not.toContain('Wash dishes')
  })

  it('moves the query-param task to the end on skip', async () => {
    routeQuery.value = { task: 't2' }
    setData(
      [
        { id: 't1', title: 'Wash dishes', status: 'open' },
        { id: 't2', title: 'Call mom', status: 'open' },
      ],
      [{ taskId: 't1' }, { taskId: 't2' }],
    )
    const wrapper = mountPage()
    await findButton(wrapper, 'Не сейчас')!.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Wash dishes')
  })

  it('falls back to normal queue when query-param task is done', () => {
    routeQuery.value = { task: 't2' }
    setData(
      [
        { id: 't1', title: 'Wash dishes', status: 'open' },
        { id: 't2', title: 'Call mom', status: 'done' },
      ],
      [{ taskId: 't1' }, { taskId: 't2' }],
    )
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('Wash dishes')
  })

  it('close button navigates to today', async () => {
    setData([{ id: 't1', title: 'Wash dishes', status: 'open' }], [{ taskId: 't1' }])
    const wrapper = mountPage()
    const closeBtn = wrapper.find('[aria-label="Закрыть"]')
    await closeBtn.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/today')
  })
})
