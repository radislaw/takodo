import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { usePomodoro, FOCUS_SECONDS } from './usePomodoro'

function mountPomodoro(options: Parameters<typeof usePomodoro>[0]) {
  let result!: ReturnType<typeof usePomodoro>
  const TestComponent = defineComponent({
    setup() {
      result = usePomodoro(options)
      return () => h('div')
    },
  })
  const wrapper = mount(TestComponent)
  return { result: () => result, wrapper }
}

describe('usePomodoro', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 0 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in idle state with full remaining time', () => {
    const { result } = mountPomodoro({ onFlush: vi.fn(), onComplete: vi.fn() })
    expect(result().status.value).toBe('idle')
    expect(result().remaining.value).toBe(FOCUS_SECONDS)
    expect(result().progress.value).toBe(0)
  })

  it('transitions to running on start()', () => {
    const { result } = mountPomodoro({ onFlush: vi.fn(), onComplete: vi.fn() })
    result().start()
    expect(result().status.value).toBe('running')
  })

  it('counts down remaining time over ticks', () => {
    const { result } = mountPomodoro({ onFlush: vi.fn(), onComplete: vi.fn() })
    result().start()
    vi.advanceTimersByTime(10_000)
    expect(result().remaining.value).toBe(FOCUS_SECONDS - 10)
  })

  it('pauses and accumulates time correctly', () => {
    const onFlush = vi.fn()
    const { result } = mountPomodoro({ onFlush, onComplete: vi.fn() })
    result().start()
    vi.advanceTimersByTime(30_000)
    result().pause()
    expect(result().status.value).toBe('paused')
    expect(result().remaining.value).toBe(FOCUS_SECONDS - 30)
    expect(onFlush).toHaveBeenCalledWith(30, undefined)
  })

  it('resumes from paused state and accumulates correctly', () => {
    const { result } = mountPomodoro({ onFlush: vi.fn(), onComplete: vi.fn() })
    result().start()
    vi.advanceTimersByTime(20_000)
    result().pause()
    // gap while paused — does not count
    vi.advanceTimersByTime(10_000)
    result().start()
    vi.advanceTimersByTime(20_000)
    // 20 + 20 = 40s elapsed
    expect(result().remaining.value).toBe(FOCUS_SECONDS - 40)
  })

  it('resets to idle with full remaining', () => {
    const { result } = mountPomodoro({ onFlush: vi.fn(), onComplete: vi.fn() })
    result().start()
    vi.advanceTimersByTime(60_000)
    result().reset()
    expect(result().status.value).toBe('idle')
    expect(result().remaining.value).toBe(FOCUS_SECONDS)
  })

  it('reset flushes accumulated time', () => {
    const onFlush = vi.fn()
    const { result } = mountPomodoro({ onFlush, onComplete: vi.fn() })
    result().start()
    vi.advanceTimersByTime(45_000)
    result().reset()
    expect(onFlush).toHaveBeenCalledWith(45, undefined)
  })

  it('does not flush when no time has elapsed', () => {
    const onFlush = vi.fn()
    const { result } = mountPomodoro({ onFlush, onComplete: vi.fn() })
    result().reset()
    expect(onFlush).not.toHaveBeenCalled()
  })

  it('calls onComplete with pomodoro flush when timer reaches zero', () => {
    const onFlush = vi.fn()
    const onComplete = vi.fn()
    const { result } = mountPomodoro({ onFlush, onComplete })
    result().start()
    vi.advanceTimersByTime(FOCUS_SECONDS * 1000)
    expect(onComplete).toHaveBeenCalled()
    expect(onFlush).toHaveBeenCalledWith(FOCUS_SECONDS, true)
  })

  it('returns to idle after completion', () => {
    const { result } = mountPomodoro({ onFlush: vi.fn(), onComplete: vi.fn() })
    result().start()
    vi.advanceTimersByTime(FOCUS_SECONDS * 1000)
    expect(result().status.value).toBe('idle')
    expect(result().remaining.value).toBe(FOCUS_SECONDS)
  })

  it('start() is no-op if already running', () => {
    const onFlush = vi.fn()
    const { result } = mountPomodoro({ onFlush, onComplete: vi.fn() })
    result().start()
    vi.advanceTimersByTime(5_000)
    result().start()
    vi.advanceTimersByTime(5_000)
    expect(result().remaining.value).toBe(FOCUS_SECONDS - 10)
  })

  it('flushes on unmount', () => {
    const onFlush = vi.fn()
    const { result, wrapper } = mountPomodoro({ onFlush, onComplete: vi.fn() })
    result().start()
    vi.advanceTimersByTime(15_000)
    wrapper.unmount()
    expect(onFlush).toHaveBeenCalledWith(15, undefined)
  })
})
