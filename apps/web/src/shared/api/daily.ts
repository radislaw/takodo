import { useQuery, useQueryCache } from '@pinia/colada'
import { apiClient } from '@/api/client'
import { useReward } from '@/shared/lib/useReward'
import { useAppMutation } from '@/shared/api/useMutationHelper'

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
  const queryCache = useQueryCache()
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
    onSettled: () => {
      const date = todayDate()
      // Entries feed quest progress (add_entries / complete_mit) and MIT-XP.
      queryCache.invalidateQueries({ key: ['daily', date], exact: true })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
    },
  })
}

export function useUpdateDailyEntry() {
  const queryCache = useQueryCache()
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
    onSettled: () => {
      const date = todayDate()
      // Entries feed quest progress (add_entries / complete_mit) and MIT-XP.
      queryCache.invalidateQueries({ key: ['daily', date], exact: true })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
    },
  })
}

export function useMoveToTomorrow() {
  const queryCache = useQueryCache()
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
    onSettled: () => {
      const today = todayDate()
      // Server increments gentleMoves (badge) and today's entry set changes.
      queryCache.invalidateQueries({ key: ['daily', today], exact: true })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
    },
  })
}

export function useUpdateDailyNote() {
  const queryCache = useQueryCache()
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
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['daily', todayDate()], exact: true })
    },
  })
}

export function useLogDoneTask() {
  const queryCache = useQueryCache()
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
      // Logging an already-done task earns the same dopamine burst as completing one.
      celebrate()
    },
    onSettled: () => {
      const date = todayDate()
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
  return useAppMutation({
    mutation: async (entryId: string) => {
      const date = todayDate()
      const { error } = await apiClient.DELETE('/daily/{date}/entries/{entryId}', {
        params: { path: { date, entryId } },
      })
      if (error) throw new Error(error.message)
    },
    onSettled: () => {
      const date = todayDate()
      // Entries feed quest progress (add_entries / complete_mit) and MIT-XP.
      queryCache.invalidateQueries({ key: ['daily', date], exact: true })
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: false })
    },
  })
}
