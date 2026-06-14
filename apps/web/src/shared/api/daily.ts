import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { apiClient } from '@/api/client'
import { useErrorToast } from '@/shared/lib/useErrorToast'
import { useReward } from '@/shared/lib/useReward'

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
      // Entries feed quest progress (add_entries / complete_mit) and MIT-XP.
      queryCache.invalidateQueries({ key: ['daily', date], exact: true })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
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
      // Entries feed quest progress (add_entries / complete_mit) and MIT-XP.
      queryCache.invalidateQueries({ key: ['daily', date], exact: true })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
    },
  })
}

export function useMoveToTomorrow() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  const today = todayDate()
  return useMutation({
    mutation: async ({ entryId }: { entryId: string; taskId: string }) => {
      const { data, error } = await apiClient.POST(
        '/daily/{date}/entries/{entryId}/move-to-tomorrow',
        { params: { path: { date: today, entryId } } },
      )
      if (error) throw new Error(error.message)
      return data!
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSettled: () => {
      // Server increments gentleMoves (badge) and today's entry set changes.
      queryCache.invalidateQueries({ key: ['daily', today], exact: true })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
    },
  })
}

export function useUpdateDailyNote() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  const date = todayDate()
  return useMutation({
    mutation: async (note: string) => {
      const { data, error } = await apiClient.PUT('/daily/{date}/note', {
        params: { path: { date } },
        body: { note },
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

export function useLogDoneTask() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  const { celebrate } = useReward()
  const date = todayDate()
  return useMutation({
    mutation: async (title: string) => {
      const { data, error } = await apiClient.POST('/daily/{date}/done', {
        params: { path: { date } },
        body: { title },
      })
      if (error) throw new Error(error.message)
      return data!
    },
    onSuccess: () => {
      // Logging an already-done task earns the same dopamine burst as completing one.
      celebrate()
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSettled: () => {
      // A done task counts toward stats — refresh rewards/quests alongside the day.
      queryCache.invalidateQueries({ key: ['daily', date], exact: true })
      queryCache.invalidateQueries({ key: ['tasks'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
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
      // Entries feed quest progress (add_entries / complete_mit) and MIT-XP.
      queryCache.invalidateQueries({ key: ['daily', date], exact: true })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
    },
  })
}
