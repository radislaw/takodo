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
