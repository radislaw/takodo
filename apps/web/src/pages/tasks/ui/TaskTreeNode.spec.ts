import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskTreeNode from './TaskTreeNode.vue'

const mockCreate = vi.fn()
const mockComplete = vi.fn()
const mockReopen = vi.fn()
const mockDelete = vi.fn()
const mockResolveResistance = vi.fn()
const mockUpdate = vi.fn()

vi.mock('@/shared/api', () => ({
  useCreateTask: () => ({ mutateAsync: mockCreate }),
  useCompleteTask: () => ({ mutate: mockComplete }),
  useReopenTask: () => ({ mutate: mockReopen }),
  useDeleteTask: () => ({ mutate: mockDelete }),
  useResolveResistance: () => ({ mutate: mockResolveResistance }),
  useUpdateTask: () => ({ mutate: mockUpdate }),
}))

interface Task {
  id: string
  parentId: string | null
  title: string
  status: 'open' | 'done'
  resistanceResolved: boolean
  normalizedTitle: string
  estimateMinutes?: number
}

const openTask: Task = {
  id: 't1',
  parentId: null,
  title: 'Parent task',
  status: 'open',
  resistanceResolved: false,
  normalizedTitle: 'parent task',
}

const childTask: Task = {
  id: 't2',
  parentId: 't1',
  title: 'Child task',
  status: 'open',
  resistanceResolved: false,
  normalizedTitle: 'child task',
}

function mountNode(task = openTask, allTasks = [openTask]) {
  return mount(TaskTreeNode, { props: { node: task, allTasks } })
}

beforeEach(() => vi.clearAllMocks())

describe('TaskTreeNode', () => {
  it('renders task title', () => {
    expect(mountNode().text()).toContain('Parent task')
  })

  it('calls completeTask on checkbox toggle for open task', async () => {
    const wrapper = mountNode()
    await wrapper.findComponent({ name: 'AppCheckbox' }).vm.$emit('update:modelValue', true)
    expect(mockComplete).toHaveBeenCalledWith('t1')
  })

  it('calls reopenTask on checkbox toggle for done task', async () => {
    const done: Task = { ...openTask, status: 'done' }
    const wrapper = mountNode(done, [done])
    await wrapper.findComponent({ name: 'AppCheckbox' }).vm.$emit('update:modelValue', false)
    expect(mockReopen).toHaveBeenCalledWith('t1')
  })

  it('calls deleteTask on delete button click', async () => {
    const wrapper = mountNode()
    const deleteBtn = wrapper.find('button[aria-label="Удалить"]')
    await deleteBtn.trigger('click')
    expect(mockDelete).toHaveBeenCalledWith('t1')
  })

  it('calls resolveResistance on chip click', async () => {
    const wrapper = mountNode()
    const chip = wrapper.findComponent({ name: 'AppChip' })
    await chip.vm.$emit('click')
    expect(mockResolveResistance).toHaveBeenCalledWith('t1')
  })

  it('renders children recursively', () => {
    const wrapper = mountNode(openTask, [openTask, childTask])
    expect(wrapper.text()).toContain('Child task')
  })

  it('shows resolved check icon when resistanceResolved', () => {
    const resolved: Task = { ...openTask, resistanceResolved: true }
    const wrapper = mountNode(resolved, [resolved])
    expect(wrapper.findComponent({ name: 'AppChip' }).exists()).toBe(false)
  })

  it('shows add step button', () => {
    expect(mountNode().text()).toContain('добавить шаг')
  })

  it('calls createTask with parentId when step submitted', async () => {
    mockCreate.mockResolvedValueOnce({ id: 't-new', title: 'Step 1' })
    const wrapper = mountNode()
    const addStepBtn = wrapper.findAll('button').find((b) => b.text().includes('добавить шаг'))
    await addStepBtn!.trigger('click')
    await wrapper.vm.$nextTick()
    const input = wrapper.find('input[type="text"], input:not([type])')
    await input.setValue('Step 1')
    await input.trigger('keydown', { key: 'Enter' })
    await wrapper.vm.$nextTick()
    expect(mockCreate).toHaveBeenCalledWith({ title: 'Step 1', parentId: 't1' })
  })
})
