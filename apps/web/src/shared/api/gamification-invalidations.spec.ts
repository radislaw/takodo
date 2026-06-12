import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada, useQueryCache, type QueryCache } from '@pinia/colada'
import { useCompleteTask, useReopenTask, useRecordFocus } from './tasks'
import { useMoveToTomorrow, useAddDailyEntry, useUpdateDailyEntry } from './daily'

vi.mock('@/api/client', () => ({
  apiClient: {
    GET: vi.fn().mockResolvedValue({ data: {}, response: { status: 200 } }),
    POST: vi.fn().mockResolvedValue({ data: { id: 'x' }, response: { status: 200 } }),
    PATCH: vi.fn().mockResolvedValue({ data: { id: 'x' }, response: { status: 200 } }),
    DELETE: vi.fn().mockResolvedValue({ response: { status: 204 } }),
  },
}))

function withSetup<T>(composable: () => T): { result: T; invalidate: ReturnType<typeof vi.spyOn> } {
  let result!: T
  let invalidate!: ReturnType<typeof vi.spyOn>
  const app = createApp(
    defineComponent({
      setup() {
        const cache: QueryCache = useQueryCache()
        invalidate = vi.spyOn(cache, 'invalidateQueries') as ReturnType<typeof vi.spyOn>
        result = composable()
        return () => h('div')
      },
    }),
  )
  app.use(createPinia())
  app.use(PiniaColada, {})
  app.mount(document.createElement('div'))
  return { result, invalidate }
}

function invalidatedKeys(invalidate: ReturnType<typeof vi.spyOn>): string[][] {
  const calls = invalidate.mock.calls as unknown as [{ key: string[] }][]
  return calls.map((c) => c[0].key)
}

describe('gamification cache invalidations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completing a task invalidates rewards and quests', async () => {
    const { result, invalidate } = withSetup(() => useCompleteTask())
    await result.mutateAsync('t1')
    const keys = invalidatedKeys(invalidate)
    expect(keys).toContainEqual(['rewards'])
    expect(keys).toContainEqual(['quests'])
  })

  it('reopening a task invalidates rewards and quests', async () => {
    const { result, invalidate } = withSetup(() => useReopenTask())
    await result.mutateAsync('t1')
    const keys = invalidatedKeys(invalidate)
    expect(keys).toContainEqual(['rewards'])
    expect(keys).toContainEqual(['quests'])
  })

  it('recording focus invalidates rewards (pomodoro XP)', async () => {
    const { result, invalidate } = withSetup(() => useRecordFocus())
    await result.mutateAsync({ id: 't1', seconds: 1500, pomodoro: true })
    expect(invalidatedKeys(invalidate)).toContainEqual(['rewards'])
  })

  it('moving an entry to tomorrow invalidates rewards (gentleMoves badge) and quests', async () => {
    const { result, invalidate } = withSetup(() => useMoveToTomorrow())
    await result.mutateAsync({ entryId: 'e1', taskId: 't1' })
    const keys = invalidatedKeys(invalidate)
    expect(keys).toContainEqual(['rewards'])
    expect(keys).toContainEqual(['quests'])
  })

  it('adding a daily entry invalidates quests (add_entries progress)', async () => {
    const { result, invalidate } = withSetup(() => useAddDailyEntry())
    await result.mutateAsync('t1')
    expect(invalidatedKeys(invalidate)).toContainEqual(['quests'])
  })

  it('toggling MIT invalidates rewards (MIT XP) and quests', async () => {
    const { result, invalidate } = withSetup(() => useUpdateDailyEntry())
    await result.mutateAsync({ entryId: 'e1', isMIT: true })
    const keys = invalidatedKeys(invalidate)
    expect(keys).toContainEqual(['rewards'])
    expect(keys).toContainEqual(['quests'])
  })
})
