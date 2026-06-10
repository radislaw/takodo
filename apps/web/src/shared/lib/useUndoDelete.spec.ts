import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUndoDelete } from './useUndoDelete'

beforeEach(() => {
  const { dismiss } = useUndoDelete()
  dismiss()
})

describe('useUndoDelete', () => {
  it('pending is null initially', () => {
    const { pending } = useUndoDelete()
    expect(pending.value).toBeNull()
  })

  it('scheduleDelete sets pending', () => {
    const { pending, scheduleDelete } = useUndoDelete()
    scheduleDelete(vi.fn())
    expect(pending.value).not.toBeNull()
  })

  it('executes delete fn after duration', () => {
    vi.useFakeTimers()
    const { scheduleDelete } = useUndoDelete()
    const onDelete = vi.fn()
    scheduleDelete(onDelete, 100)
    vi.advanceTimersByTime(100)
    expect(onDelete).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('cancel prevents delete fn from firing', () => {
    vi.useFakeTimers()
    const { pending, scheduleDelete } = useUndoDelete()
    const onDelete = vi.fn()
    scheduleDelete(onDelete, 100)
    pending.value!.cancel()
    vi.advanceTimersByTime(100)
    expect(onDelete).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('cancel clears pending', () => {
    const { pending, scheduleDelete } = useUndoDelete()
    scheduleDelete(vi.fn())
    pending.value!.cancel()
    expect(pending.value).toBeNull()
  })

  it('dismiss clears pending without firing fn', () => {
    vi.useFakeTimers()
    const { pending, scheduleDelete, dismiss } = useUndoDelete()
    const onDelete = vi.fn()
    scheduleDelete(onDelete, 100)
    dismiss()
    vi.advanceTimersByTime(100)
    expect(onDelete).not.toHaveBeenCalled()
    expect(pending.value).toBeNull()
    vi.useRealTimers()
  })

  it('second scheduleDelete cancels previous timer', () => {
    vi.useFakeTimers()
    const { scheduleDelete } = useUndoDelete()
    const first = vi.fn()
    const second = vi.fn()
    scheduleDelete(first, 200)
    scheduleDelete(second, 100)
    vi.advanceTimersByTime(200)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('singleton: same pending ref across calls', () => {
    const { pending: a } = useUndoDelete()
    const { pending: b } = useUndoDelete()
    expect(a).toBe(b)
  })
})
