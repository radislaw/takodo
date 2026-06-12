import { useQuery, useMutation, useQueryCache } from '@pinia/colada'
import { apiClient } from '@/api/client'
import { useErrorToast } from '@/shared/lib/useErrorToast'
import { todayDate } from './daily'

export function useQuests() {
  // Quest day must match the daily-list day, which is the client's local date.
  const date = todayDate()
  return useQuery({
    key: () => ['quests', date],
    query: async () => {
      const { data } = await apiClient.GET('/quests', { params: { query: { date } } })
      if (!data) throw new Error('Failed to fetch quests')
      return data
    },
  })
}

export function useClaimQuest() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  const date = todayDate()
  return useMutation({
    mutation: async (id: string) => {
      const { data } = await apiClient.POST('/quests/{id}/claim', {
        params: { path: { id }, query: { date } },
      })
      if (!data) throw new Error('Failed to claim quest')
      return data
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['quests'], exact: false })
      queryCache.invalidateQueries({ key: ['rewards'], exact: true })
    },
  })
}
