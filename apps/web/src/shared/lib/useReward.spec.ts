import { describe, it, expect, beforeEach } from 'vitest'
import { useReward } from './useReward'

beforeEach(() => {
  const { hide } = useReward()
  hide()
})

describe('useReward', () => {
  it('isVisible starts false', () => {
    const { isVisible } = useReward()
    expect(isVisible.value).toBe(false)
  })

  it('celebrate() sets isVisible true', () => {
    const { celebrate, isVisible } = useReward()
    celebrate()
    expect(isVisible.value).toBe(true)
  })

  it('repeated celebrate() does not break state', () => {
    const { celebrate, isVisible } = useReward()
    celebrate()
    celebrate()
    expect(isVisible.value).toBe(true)
  })

  it('hide() resets isVisible to false', () => {
    const { celebrate, hide, isVisible } = useReward()
    celebrate()
    hide()
    expect(isVisible.value).toBe(false)
  })
})
