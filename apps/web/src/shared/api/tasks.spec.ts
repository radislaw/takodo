import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/client', () => ({
  apiClient: {
    GET: vi.fn(),
    POST: vi.fn(),
    PATCH: vi.fn(),
    DELETE: vi.fn(),
  },
}))

import { apiClient } from '@/api/client'

const mockGet = apiClient.GET as ReturnType<typeof vi.fn>
const mockPost = apiClient.POST as ReturnType<typeof vi.fn>
const mockPatch = apiClient.PATCH as ReturnType<typeof vi.fn>
const mockDelete = apiClient.DELETE as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

const fakeTask = {
  id: 't1',
  parentId: null,
  title: 'Buy milk',
  resistanceResolved: false,
  status: 'open' as const,
  completedAt: null,
  normalizedTitle: 'buy milk',
  createdAt: '2026-06-05T00:00:00.000Z',
}

describe('apiClient GET /tasks', () => {
  it('returns task array', async () => {
    mockGet.mockResolvedValueOnce({ data: [fakeTask], error: null })
    const { data, error } = await apiClient.GET('/tasks')
    expect(data).toEqual([fakeTask])
    expect(error).toBeNull()
  })
})

describe('apiClient POST /tasks', () => {
  it('creates task and returns it', async () => {
    mockPost.mockResolvedValueOnce({ data: fakeTask, error: null })
    const { data } = await apiClient.POST('/tasks', { body: { title: 'Buy milk' } })
    expect(mockPost).toHaveBeenCalledWith('/tasks', { body: { title: 'Buy milk' } })
    expect(data).toEqual(fakeTask)
  })
})

describe('apiClient POST /tasks/{id}/complete', () => {
  it('calls complete endpoint with task id', async () => {
    const done = { ...fakeTask, status: 'done' as const }
    mockPost.mockResolvedValueOnce({ data: done, error: null })
    const { data } = await apiClient.POST('/tasks/{id}/complete', {
      params: { path: { id: 't1' } },
    })
    expect(mockPost).toHaveBeenCalledWith('/tasks/{id}/complete', {
      params: { path: { id: 't1' } },
    })
    expect(data?.status).toBe('done')
  })
})

describe('apiClient POST /tasks/{id}/reopen', () => {
  it('calls reopen endpoint with task id', async () => {
    mockPost.mockResolvedValueOnce({ data: fakeTask, error: null })
    const { data } = await apiClient.POST('/tasks/{id}/reopen', {
      params: { path: { id: 't1' } },
    })
    expect(data?.status).toBe('open')
  })
})

describe('apiClient PATCH /tasks/{id}', () => {
  it('updates task title and returns updated task', async () => {
    const updated = { ...fakeTask, title: 'Updated title' }
    mockPatch.mockResolvedValueOnce({ data: updated, error: null })
    const { data } = await apiClient.PATCH('/tasks/{id}', {
      params: { path: { id: 't1' } },
      body: { title: 'Updated title' },
    })
    expect(mockPatch).toHaveBeenCalledWith('/tasks/{id}', {
      params: { path: { id: 't1' } },
      body: { title: 'Updated title' },
    })
    expect(data?.title).toBe('Updated title')
  })
})

describe('apiClient DELETE /tasks/{id}', () => {
  it('calls delete endpoint with task id', async () => {
    mockDelete.mockResolvedValueOnce({ error: null })
    await apiClient.DELETE('/tasks/{id}', { params: { path: { id: 't1' } } })
    expect(mockDelete).toHaveBeenCalledWith('/tasks/{id}', { params: { path: { id: 't1' } } })
  })
})

describe('apiClient POST /tasks/{id}/resolve-resistance', () => {
  it('returns task with resistanceResolved true', async () => {
    const resolved = { ...fakeTask, resistanceResolved: true }
    mockPost.mockResolvedValueOnce({ data: resolved, error: null })
    const { data } = await apiClient.POST('/tasks/{id}/resolve-resistance', {
      params: { path: { id: 't1' } },
    })
    expect(data?.resistanceResolved).toBe(true)
  })
})
