import { describe, it, expect, vi, afterEach } from 'vitest'

describe('playChime', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('does not throw when AudioContext is unavailable (jsdom default)', async () => {
    const { playChime } = await import('./chime')
    expect(() => playChime()).not.toThrow()
  })

  it('creates two oscillators when AudioContext is available', async () => {
    const mockStop = vi.fn()
    const mockStart = vi.fn()
    const mockOscConnect = vi.fn()
    const mockGainConnect = vi.fn()
    const mockSetValue = vi.fn()
    const mockRamp = vi.fn()

    const makeOsc = () => ({
      connect: mockOscConnect,
      frequency: { value: 0 },
      type: 'sine' as OscillatorType,
      start: mockStart,
      stop: mockStop,
    })
    const makeGain = () => ({
      connect: mockGainConnect,
      gain: { setValueAtTime: mockSetValue, exponentialRampToValueAtTime: mockRamp },
    })

    const mockCtx = {
      currentTime: 0,
      createOscillator: vi.fn().mockImplementation(makeOsc),
      createGain: vi.fn().mockImplementation(makeGain),
      destination: {},
    }

    vi.stubGlobal(
      'AudioContext',
      vi.fn().mockImplementation(function () {
        return mockCtx
      }),
    )

    const { playChime } = await import('./chime')
    playChime()

    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2)
    expect(mockStart).toHaveBeenCalledTimes(2)
  })
})
