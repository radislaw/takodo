import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchDailyByDate, todayDate } from './daily'

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

describe('todayDate', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = todayDate()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('fetchDailyByDate', () => {
  const fakeList = {
    id: 'list-1',
    date: '2026-06-05',
    createdAt: '2026-06-05T00:00:00.000Z',
    entries: [{ id: 'e1', taskId: 't1', isMIT: true, order: 0 }],
  }

  it('returns data on 200', async () => {
    mockGet.mockResolvedValueOnce({ data: fakeList, response: { status: 200 } })

    const result = await fetchDailyByDate('2026-06-05')

    expect(mockGet).toHaveBeenCalledWith('/daily/{date}', {
      params: { path: { date: '2026-06-05' } },
    })
    expect(result).toEqual(fakeList)
  })

  it('calls POST /daily on 404 and returns created list with empty entries', async () => {
    const created = { id: 'list-new', date: '2026-06-05', createdAt: '2026-06-05T00:00:00.000Z' }
    mockGet.mockResolvedValueOnce({ data: undefined, response: { status: 404 } })
    mockPost.mockResolvedValueOnce({ data: created, error: null })

    const result = await fetchDailyByDate('2026-06-05')

    expect(mockPost).toHaveBeenCalledWith('/daily', { body: { date: '2026-06-05' } })
    expect(result).toEqual({ ...created, entries: [] })
  })

  it('throws when POST /daily returns error', async () => {
    mockGet.mockResolvedValueOnce({ data: undefined, response: { status: 404 } })
    mockPost.mockResolvedValueOnce({ data: undefined, error: { message: 'server error' } })

    await expect(fetchDailyByDate('2026-06-05')).rejects.toThrow('Failed to create daily list')
  })
})
