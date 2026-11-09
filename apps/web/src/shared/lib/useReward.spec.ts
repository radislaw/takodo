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

  it('isEpic defaults to false on plain celebrate()', () => {
    const { celebrate, isEpic } = useReward()
    celebrate()
    expect(isEpic.value).toBe(false)
  })

  it('celebrate({ epic: true }) sets isEpic', () => {
    const { celebrate, isEpic } = useReward()
    celebrate({ epic: true })
    expect(isEpic.value).toBe(true)
  })

  it('hide() resets isEpic', () => {
    const { celebrate, hide, isEpic } = useReward()
    celebrate({ epic: true })
    hide()
    expect(isEpic.value).toBe(false)
  })

  it('plain celebrate() after epic resets isEpic', () => {
    const { celebrate, hide, isEpic } = useReward()
    celebrate({ epic: true })
    hide()
    celebrate()
    expect(isEpic.value).toBe(false)
  })
})
