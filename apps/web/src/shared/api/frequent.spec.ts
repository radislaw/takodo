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

beforeEach(() => vi.clearAllMocks())

const fakeFrequent = [
  { normalizedTitle: 'buy milk', title: 'Buy milk', undoneDays: 3 },
  { normalizedTitle: 'call mom', title: 'Call mom', undoneDays: 5 },
]

describe('apiClient GET /frequent', () => {
  it('returns frequent task array', async () => {
    mockGet.mockResolvedValueOnce({ data: fakeFrequent, error: null })
    const { data } = await apiClient.GET('/frequent', { params: { query: { minDays: 1 } } })
    expect(data).toEqual(fakeFrequent)
  })

  it('passes minDays query param', async () => {
    mockGet.mockResolvedValueOnce({ data: [], error: null })
    await apiClient.GET('/frequent', { params: { query: { minDays: 3 } } })
    expect(mockGet).toHaveBeenCalledWith('/frequent', { params: { query: { minDays: 3 } } })
  })

  it('returns empty array when no frequent tasks', async () => {
    mockGet.mockResolvedValueOnce({ data: [], error: null })
    const { data } = await apiClient.GET('/frequent', { params: { query: { minDays: 1 } } })
    expect(data).toEqual([])
  })
})
