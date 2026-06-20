import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TodayTaskCard from './TodayTaskCard.vue'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const ENTRY = { id: 'e1', taskId: 't1', isMIT: false }
const TASK = { id: 't1', title: 'Buy milk', status: 'open' }

function mountCard(props = {}) {
  return mount(TodayTaskCard, {
    props: { entry: ENTRY, task: TASK, ...props },
  })
}

function bodyButton(text: string): HTMLButtonElement | undefined {
  return Array.from(document.body.querySelectorAll('button')).find((b) =>
    b.textContent?.includes(text),
  )
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('TodayTaskCard', () => {
  it('renders task title', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('Buy milk')
  })

  it('applies strikethrough when task is done', () => {
    const wrapper = mountCard({ task: { ...TASK, status: 'done' } })
    const btn = wrapper.find('button.w-full')
    expect(btn.classes()).toContain('line-through')
  })

  it('emits toggleDone on checkbox change', async () => {
    const wrapper = mountCard()
    await wrapper.findComponent({ name: 'AppCheckbox' }).vm.$emit('update:modelValue', true)
    expect(wrapper.emitted('toggleDone')?.[0]).toEqual(['t1', 'open'])
  })

  it('emits toggleMit on direct MIT button click', async () => {
    const wrapper = mountCard()
    await wrapper.find('[aria-label="Сделать главным"]').trigger('click')
    expect(wrapper.emitted('toggleMit')?.[0]).toEqual(['e1', false])
  })

  it('emits toggleMit to unset when entry is MIT', async () => {
    const wrapper = mountCard({ entry: { ...ENTRY, isMIT: true } })
    await wrapper.find('[aria-label="Убрать из главных"]').trigger('click')
    expect(wrapper.emitted('toggleMit')?.[0]).toEqual(['e1', true])
  })

  it('emits moveTomorrow from the actions overflow sheet', async () => {
    const wrapper = mountCard()
    await wrapper.find('[aria-label="Действия"]').trigger('click')
    bodyButton('Перенести на завтра')?.click()
    expect(wrapper.emitted('moveTomorrow')?.[0]).toEqual(['e1', 't1'])
  })

  it('hides the actions overflow button for done task', () => {
    const wrapper = mountCard({ task: { ...TASK, status: 'done' } })
    expect(wrapper.find('[aria-label="Действия"]').exists()).toBe(false)
  })

  it('shows MIT badge when isMIT is true', () => {
    const wrapper = mountCard({ entry: { ...ENTRY, isMIT: true } })
    expect(wrapper.findComponent({ name: 'AppBadge' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('Главное')
  })

  it('navigates to do-mode with task id on play button click', async () => {
    const wrapper = mountCard()
    const playBtn = wrapper.find('[aria-label="Начать с этого дела"]')
    expect(playBtn.exists()).toBe(true)
    await playBtn.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/do?task=t1')
  })

  it('hides play button for done task', () => {
    const wrapper = mountCard({ task: { ...TASK, status: 'done' } })
    expect(wrapper.find('[aria-label="Начать с этого дела"]').exists()).toBe(false)
  })

  it('shows subtask counter when childTotal > 0', () => {
    const wrapper = mountCard({ childDone: 1, childTotal: 3 })
    expect(wrapper.text()).toContain('1/3')
  })

  it('hides subtask counter when childTotal is 0', () => {
    const wrapper = mountCard({ childDone: 0, childTotal: 0 })
    expect(wrapper.find('span.text-xs').exists()).toBe(false)
  })
})
