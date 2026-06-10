import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PomodoroTimer from './PomodoroTimer.vue'

const { mockRecordFocus, mockPlayChime } = vi.hoisted(() => ({
  mockRecordFocus: vi.fn(),
  mockPlayChime: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  useRecordFocus: () => ({ mutate: mockRecordFocus }),
}))

vi.mock('@/shared/lib/chime', () => ({ playChime: mockPlayChime }))

vi.mock('@/shared/lib/formatFocus', () => ({
  formatFocusDuration: (seconds: number) => `${Math.floor(seconds / 60)} мин`,
}))

function motionAllowed() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

function motionReduced() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

function mountTimer(props: Record<string, unknown> = {}) {
  return mount(PomodoroTimer, {
    props: { taskId: 'task-1', focusSeconds: 0, pomodoros: 0, ...props },
    global: {
      stubs: { AppIcon: true },
    },
  })
}

describe('PomodoroTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 0 })
    motionAllowed()
    mockRecordFocus.mockReset()
    mockPlayChime.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders 25:00 countdown on mount', () => {
    const wrapper = mountTimer()
    expect(wrapper.text()).toContain('25:00')
  })

  it('role="timer" present', () => {
    const wrapper = mountTimer()
    expect(wrapper.find('[role="timer"]').exists()).toBe(true)
  })

  it('counts down when started', async () => {
    const wrapper = mountTimer()
    await wrapper.find('[aria-label="Старт"]').trigger('click')
    vi.advanceTimersByTime(10_000)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('24:50')
  })

  it('stops counting after pause', async () => {
    const wrapper = mountTimer()
    await wrapper.find('[aria-label="Старт"]').trigger('click')
    vi.advanceTimersByTime(5_000)
    await wrapper.vm.$nextTick()
    await wrapper.find('[aria-label="Пауза"]').trigger('click')
    vi.advanceTimersByTime(5_000)
    await wrapper.vm.$nextTick()
    // still 24:55 (only 5s of running)
    expect(wrapper.text()).toContain('24:55')
  })

  it('resets to 25:00 on reset', async () => {
    const wrapper = mountTimer()
    await wrapper.find('[aria-label="Старт"]').trigger('click')
    vi.advanceTimersByTime(30_000)
    await wrapper.vm.$nextTick()
    await wrapper.find('[aria-label="Сбросить"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('25:00')
  })

  it('shows stats when focusSeconds > 0', () => {
    const wrapper = mountTimer({ focusSeconds: 1500, pomodoros: 1 })
    expect(wrapper.text()).toContain('25 мин')
  })

  it('hides stats when focusSeconds=0 and pomodoros=0', () => {
    const wrapper = mountTimer({ focusSeconds: 0, pomodoros: 0 })
    expect(wrapper.text()).not.toContain('мин')
  })

  it('renders one tomato icon per pomodoro', () => {
    const wrapper = mountTimer({ focusSeconds: 1500, pomodoros: 3 })
    expect(wrapper.findAll('[name="tomato"]')).toHaveLength(3)
  })

  it('caps tomato icons at 5 and shows overflow count', () => {
    const wrapper = mountTimer({ focusSeconds: 1500, pomodoros: 8 })
    expect(wrapper.findAll('[name="tomato"]')).toHaveLength(5)
    expect(wrapper.text()).toContain('+3')
  })

  it('renders no tomato icons when pomodoros=0', () => {
    const wrapper = mountTimer({ focusSeconds: 1500, pomodoros: 0 })
    expect(wrapper.findAll('[name="tomato"]')).toHaveLength(0)
  })

  it('shows ripple on completion when motion allowed', async () => {
    const wrapper = mountTimer()
    await wrapper.find('[aria-label="Старт"]').trigger('click')
    vi.advanceTimersByTime(1500 * 1000)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.ripple').length).toBeGreaterThan(0)
  })

  it('no ripple when prefers-reduced-motion', async () => {
    motionReduced()
    const wrapper = mountTimer()
    await wrapper.find('[aria-label="Старт"]').trigger('click')
    vi.advanceTimersByTime(1500 * 1000)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.ripple').length).toBe(0)
  })

  it('calls playChime on completion', async () => {
    const wrapper = mountTimer()
    await wrapper.find('[aria-label="Старт"]').trigger('click')
    vi.advanceTimersByTime(1500 * 1000)
    await flushPromises()
    expect(mockPlayChime).toHaveBeenCalled()
  })

  it('calls recordFocus with elapsed seconds on pause', async () => {
    const wrapper = mountTimer()
    await wrapper.find('[aria-label="Старт"]').trigger('click')
    vi.advanceTimersByTime(60_000)
    await wrapper.vm.$nextTick()
    await wrapper.find('[aria-label="Пауза"]').trigger('click')
    expect(mockRecordFocus).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'task-1', seconds: 60 }),
    )
  })
})
