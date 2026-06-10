import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TodayTaskCard from './TodayTaskCard.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const ENTRY = { id: 'e1', taskId: 't1', isMIT: false }
const TASK = { id: 't1', title: 'Buy milk', status: 'open' }

function mountCard(props = {}) {
  return mount(TodayTaskCard, {
    props: { entry: ENTRY, task: TASK, ...props },
  })
}

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

  it('emits toggleMit on zap button click', async () => {
    const wrapper = mountCard()
    // first aria-label button is "На завтра", second is "Главное"
    const buttons = wrapper.findAll('button[aria-label]')
    const mitBtn = buttons[buttons.length - 1]
    await mitBtn.trigger('click')
    expect(wrapper.emitted('toggleMit')?.[0]).toEqual(['e1', false])
  })

  it('emits moveTomorrow on arrow button click for active task', async () => {
    const wrapper = mountCard()
    const arrowBtn = wrapper.find('[aria-label="На завтра"]')
    expect(arrowBtn.exists()).toBe(true)
    await arrowBtn.trigger('click')
    expect(wrapper.emitted('moveTomorrow')?.[0]).toEqual(['e1', 't1'])
  })

  it('hides moveTomorrow button for done task', () => {
    const wrapper = mountCard({ task: { ...TASK, status: 'done' } })
    expect(wrapper.find('[aria-label="На завтра"]').exists()).toBe(false)
  })

  it('shows MIT badge when isMIT is true', () => {
    const wrapper = mountCard({ entry: { ...ENTRY, isMIT: true } })
    expect(wrapper.findComponent({ name: 'AppBadge' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('Главное')
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
