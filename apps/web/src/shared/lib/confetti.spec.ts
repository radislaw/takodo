import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

import confetti from 'canvas-confetti'
import { fireConfetti, fireFireworks } from './confetti'

const mockConfetti = vi.mocked(confetti)

beforeEach(() => {
  mockConfetti.mockClear()
})

describe('fireConfetti', () => {
  it('calls confetti once with expected options', () => {
    fireConfetti()
    expect(mockConfetti).toHaveBeenCalledOnce()
    const opts = mockConfetti.mock.calls[0]?.[0]
    expect(opts?.particleCount).toBeGreaterThan(0)
    expect(opts?.spread).toBeGreaterThan(0)
    expect(opts?.colors).toBeDefined()
  })
})

describe('fireFireworks', () => {
  it('calls confetti multiple times via rAF loop', () => {
    let rafCalls = 0
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      if (rafCalls++ < 3) cb(0)
      return rafCalls
    })
    vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValue(99999)

    fireFireworks()
    expect(mockConfetti.mock.calls.length).toBeGreaterThanOrEqual(2)

    vi.restoreAllMocks()
  })
})
