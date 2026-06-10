import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSuccessToast } from './useSuccessToast'

beforeEach(() => {
  useSuccessToast().hideSuccess()
  vi.useRealTimers()
})

describe('useSuccessToast', () => {
  it('key is null initially', () => {
    const { key } = useSuccessToast()
    expect(key.value).toBeNull()
  })

  it('sets key on showSuccess', () => {
    const { key, showSuccess } = useSuccessToast()
    showSuccess('success.addedToToday')
    expect(key.value).toBe('success.addedToToday')
  })

  it('clears key after duration', async () => {
    vi.useFakeTimers()
    const { key, showSuccess } = useSuccessToast()
    showSuccess('success.addedToToday', 1000)
    expect(key.value).toBe('success.addedToToday')
    vi.advanceTimersByTime(1000)
    expect(key.value).toBeNull()
  })

  it('hideSuccess clears key immediately', () => {
    const { key, showSuccess, hideSuccess } = useSuccessToast()
    showSuccess('success.addedToToday')
    hideSuccess()
    expect(key.value).toBeNull()
  })
})
