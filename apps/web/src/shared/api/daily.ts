import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { apiClient } from '@/api/client'
import { useErrorToast } from '@/shared/lib/useErrorToast'

export function todayDate(timeZone?: string): string {
  const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
}

export function tomorrowDate(timeZone?: string): string {
  const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d)
}

export async function fetchDailyByDate(date: string) {
  const { data, response } = await apiClient.GET('/daily/{date}', {
    params: { path: { date } },
  })
  if (response.status === 404) {
    const { data: created } = await apiClient.POST('/daily', {
      body: { date },
    })
    if (!created) throw new Error('Failed to create daily list')
    return {
      ...created,
      entries: [] as { id: string; taskId: string; isMIT: boolean; order: number }[],
    }
  }
  return data!
}

export function useDailyToday() {
  const date = todayDate()
  return useQuery({
    key: () => ['daily', date],
    query: () => fetchDailyByDate(date),
  })
}

export function useAddDailyEntry() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  const date = todayDate()
  return useMutation({
    mutation: async (taskId: string) => {
      const { data, error } = await apiClient.POST('/daily/{date}/entries', {
        params: { path: { date } },
        body: { taskId },
      })
      if (error) throw new Error(error.message)
      return data!
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['daily', date], exact: true })
    },
  })
}

export function useUpdateDailyEntry() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  const date = todayDate()
  return useMutation({
    mutation: async ({
      entryId,
      isMIT,
      order,
    }: {
      entryId: string
      isMIT?: boolean
      order?: number
    }) => {
      const { data, error, response } = await apiClient.PATCH('/daily/{date}/entries/{entryId}', {
        params: { path: { date, entryId } },
        body: { isMIT, order },
      })
      if (response.status === 400) {
        const err = Object.assign(new Error('MIT limit of 3 reached'), { code: 'mit_limit' })
        throw err
      }
      if (error) throw new Error(error.message)
      return data!
    },
    onError: (err: unknown) => {
      if ((err as { code?: string }).code !== 'mit_limit') {
        showError('errors.saveFailed')
      }
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['daily', date], exact: true })
    },
  })
}

export function useMoveToTomorrow() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  const today = todayDate()
  const tomorrow = tomorrowDate()
  return useMutation({
    mutation: async ({ entryId, taskId }: { entryId: string; taskId: string }) => {
      // ensure tomorrow's daily list exists
      const { response } = await apiClient.GET('/daily/{date}', {
        params: { path: { date: tomorrow } },
      })
      if (response.status === 404) {
        const { data: created } = await apiClient.POST('/daily', { body: { date: tomorrow } })
        if (!created) throw new Error('Failed to create tomorrow daily list')
      }

      // add to tomorrow first so we never lose the task
      const { data, error } = await apiClient.POST('/daily/{date}/entries', {
        params: { path: { date: tomorrow } },
        body: { taskId },
      })
      if (error) throw new Error(error.message)

      // remove from today
      await apiClient.DELETE('/daily/{date}/entries/{entryId}', {
        params: { path: { date: today, entryId } },
      })

      return data!
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['daily', today], exact: true })
    },
  })
}

export function useRemoveDailyEntry() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  const date = todayDate()
  return useMutation({
    mutation: async (entryId: string) => {
      const { error } = await apiClient.DELETE('/daily/{date}/entries/{entryId}', {
        params: { path: { date, entryId } },
      })
      if (error) throw new Error(error.message)
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['daily', date], exact: true })
    },
  })
}
