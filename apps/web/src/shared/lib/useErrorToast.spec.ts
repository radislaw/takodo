import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useErrorToast } from './useErrorToast'

beforeEach(() => {
  const { hideError } = useErrorToast()
  hideError()
})

describe('useErrorToast', () => {
  it('key starts null', () => {
    const { key } = useErrorToast()
    expect(key.value).toBeNull()
  })

  it('showError sets key', () => {
    const { key, showError } = useErrorToast()
    showError('errors.saveFailed')
    expect(key.value).toBe('errors.saveFailed')
  })

  it('hideError clears key immediately', () => {
    const { key, showError, hideError } = useErrorToast()
    showError('errors.saveFailed')
    hideError()
    expect(key.value).toBeNull()
  })

  it('key auto-clears after duration', () => {
    vi.useFakeTimers()
    const { key, showError } = useErrorToast()
    showError('errors.saveFailed', 100)
    expect(key.value).toBe('errors.saveFailed')
    vi.advanceTimersByTime(100)
    expect(key.value).toBeNull()
    vi.useRealTimers()
  })

  it('second showError replaces first and resets timer', () => {
    vi.useFakeTimers()
    const { key, showError } = useErrorToast()
    showError('errors.saveFailed', 100)
    showError('errors.addFailed', 200)
    expect(key.value).toBe('errors.addFailed')
    vi.advanceTimersByTime(100)
    expect(key.value).toBe('errors.addFailed')
    vi.advanceTimersByTime(100)
    expect(key.value).toBeNull()
    vi.useRealTimers()
  })

  it('singleton: same ref across calls', () => {
    const { key: a } = useErrorToast()
    const { key: b } = useErrorToast()
    expect(a).toBe(b)
  })
})
