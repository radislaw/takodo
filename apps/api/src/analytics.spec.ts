import { describe, expect, it } from 'vitest'

import { track } from './analytics'

describe('track', () => {
  it('does not throw for a bare event type', () => {
    expect(() => track({ type: 'task_done' })).not.toThrow()
  })

  it('does not throw with an optional payload', () => {
    expect(() => track({ type: 'task_done', payload: { taskId: 'abc' } })).not.toThrow()
  })

  it('returns void', () => {
    expect(track({ type: 'daily_created' })).toBeUndefined()
  })
})
