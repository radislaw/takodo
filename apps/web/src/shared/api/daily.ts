import { useQuery } from '@pinia/colada'
import { apiClient } from '@/api/client'
import { useReward } from '@/shared/lib/useReward'
import { useAppMutation } from '@/shared/api/useMutationHelper'
import { useCacheInvalidate } from './cache-deps'

export function todayDate(timeZone?: string): string {
  const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
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
      note: undefined as string | undefined,
    }
  }
  return data!
}

export function useDailyToday() {
  return useQuery({
    key: () => ['daily', todayDate()],
    query: () => fetchDailyByDate(todayDate()),
  })
}

export function useAddDailyEntry() {
  const inv = useCacheInvalidate()
  return useAppMutation({
    mutation: async (taskId: string) => {
      const date = todayDate()
      const { data, error } = await apiClient.POST('/daily/{date}/entries', {
        params: { path: { date } },
        body: { taskId },
      })
      if (error) throw new Error(error.message)
      return data!
    },
    onSettled: () => inv.dailyEntry(),
  })
}

export function useUpdateDailyEntry() {
  const inv = useCacheInvalidate()
  return useAppMutation({
    mutation: async ({
      entryId,
      isMIT,
      order,
    }: {
      entryId: string
      isMIT?: boolean
      order?: number
    }) => {
      const date = todayDate()
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
    onError: (err) => {
      if ((err as { code?: string }).code === 'mit_limit') return true
    },
    onSettled: () => inv.dailyEntry(),
  })
}

export function useMoveToTomorrow() {
  const inv = useCacheInvalidate()
  return useAppMutation({
    mutation: async ({ entryId }: { entryId: string; taskId: string }) => {
      const today = todayDate()
      const { data, error } = await apiClient.POST(
        '/daily/{date}/entries/{entryId}/move-to-tomorrow',
        { params: { path: { date: today, entryId } } },
      )
      if (error) throw new Error(error.message)
      return data!
    },
    onSettled: () => inv.dailyEntry(),
  })
}

export function useUpdateDailyNote() {
  const inv = useCacheInvalidate()
  return useAppMutation({
    mutation: async (note: string) => {
      const date = todayDate()
      const { data, error } = await apiClient.PUT('/daily/{date}/note', {
        params: { path: { date } },
        body: { note },
      })
      if (error) throw new Error(error.message)
      return data!
    },
    onSettled: () => inv.dailyNote(),
  })
}

export function useLogDoneTask() {
  const inv = useCacheInvalidate()
  const { celebrate } = useReward()
  return useAppMutation({
    mutation: async (title: string) => {
      const date = todayDate()
      const { data, error } = await apiClient.POST('/daily/{date}/done', {
        params: { path: { date } },
        body: { title },
      })
      if (error) throw new Error(error.message)
      return data!
    },
    onSuccess: () => {
      celebrate()
    },
    onSettled: () => inv.logDone(),
  })
}

export function useRemoveDailyEntry() {
  const inv = useCacheInvalidate()
  return useAppMutation({
    mutation: async (entryId: string) => {
      const date = todayDate()
      const { error } = await apiClient.DELETE('/daily/{date}/entries/{entryId}', {
        params: { path: { date, entryId } },
      })
      if (error) throw new Error(error.message)
    },
    onSettled: () => inv.dailyEntry(),
  })
}
