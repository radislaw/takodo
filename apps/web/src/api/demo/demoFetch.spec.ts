import { describe, it, expect, beforeEach } from 'vitest'
import { demoFetch, resetDemoData } from './demoFetch'

const BASE = 'http://demo.local'

async function call<T = unknown>(method: string, path: string, body?: unknown) {
  const res = await demoFetch(
    new Request(`${BASE}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )
  const text = await res.text()
  return { status: res.status, data: (text ? JSON.parse(text) : null) as T }
}

type Task = { id: string; status: string; parentId: string | null; title: string }

beforeEach(() => {
  window.localStorage.clear()
  resetDemoData()
})

describe('demoFetch', () => {
  it('seeds tasks and a daily list for today', async () => {
    const tasks = await call<Task[]>('GET', '/tasks')
    expect(tasks.data.length).toBeGreaterThan(5)
    const today = new Intl.DateTimeFormat('en-CA').format(new Date())
    const daily = await call<{ entries: unknown[] }>('GET', `/daily/${today}`)
    expect(daily.status).toBe(200)
    expect(daily.data.entries.length).toBeGreaterThan(0)
  })

  it('returns 404 for a day without a list, then creates it', async () => {
    expect((await call('GET', '/daily/2000-01-01')).status).toBe(404)
    expect((await call('POST', '/daily', { date: '2000-01-01' })).status).toBe(200)
    expect((await call('GET', '/daily/2000-01-01')).status).toBe(200)
  })

  it('completes a parent when its last child is completed and reopens it again', async () => {
    const parent = (await call<Task>('POST', '/tasks', { title: 'parent' })).data
    const a = (await call<Task>('POST', '/tasks', { title: 'a', parentId: parent.id })).data
    const b = (await call<Task>('POST', '/tasks', { title: 'b', parentId: parent.id })).data

    await call('POST', `/tasks/${a.id}/complete`)
    expect((await call<Task>('GET', `/tasks/${parent.id}`)).data.status).toBe('open')
    await call('POST', `/tasks/${b.id}/complete`)
    expect((await call<Task>('GET', `/tasks/${parent.id}`)).data.status).toBe('done')

    await call('POST', `/tasks/${a.id}/reopen`)
    expect((await call<Task>('GET', `/tasks/${parent.id}`)).data.status).toBe('open')
  })

  it('deletes a task together with its subtree and daily entries', async () => {
    const parent = (await call<Task>('POST', '/tasks', { title: 'p' })).data
    const child = (await call<Task>('POST', '/tasks', { title: 'c', parentId: parent.id })).data
    await call('DELETE', `/tasks/${parent.id}`)
    expect((await call('GET', `/tasks/${child.id}`)).status).toBe(404)
  })

  it('moves an entry to tomorrow', async () => {
    const today = new Intl.DateTimeFormat('en-CA').format(new Date())
    const list = (await call<{ entries: { id: string }[] }>('GET', `/daily/${today}`)).data
    const entry = list.entries[0]!
    const moved = await call('POST', `/daily/${today}/entries/${entry.id}/move-to-tomorrow`)
    expect(moved.status).toBe(200)
    const after = (await call<{ entries: { id: string }[] }>('GET', `/daily/${today}`)).data
    expect(after.entries.some((e) => e.id === entry.id)).toBe(false)
  })

  it('refuses to claim an unfinished quest and grants xp for a finished one', async () => {
    const today = new Intl.DateTimeFormat('en-CA').format(new Date())
    const quests = (
      await call<{ id: string; done: boolean; xp: number }[]>('GET', `/quests?date=${today}`)
    ).data
    expect(quests).toHaveLength(3)
    const open = quests.find((q) => !q.done)
    if (open) {
      expect((await call('POST', `/quests/${open.id}/claim?date=${today}`)).status).toBe(409)
    }
  })

  it('computes a streak from the seeded history and counts new completions', async () => {
    const before = (await call<{ streak: number; xp: number }>('GET', '/rewards')).data
    const t = (await call<Task>('POST', '/tasks', { title: 'fresh' })).data
    await call('POST', `/tasks/${t.id}/complete`)
    const after = (await call<{ streak: number; xp: number }>('GET', '/rewards')).data
    expect(after.xp).toBe(before.xp + 10)
    expect(after.streak).toBeGreaterThanOrEqual(before.streak)
  })

  it('answers unknown routes with 404 instead of throwing', async () => {
    expect((await call('GET', '/nope')).status).toBe(404)
  })
})
