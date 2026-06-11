import { useQuery, useMutation, useQueryCache } from '@pinia/colada'
import { apiClient } from '@/api/client'
import { useErrorToast } from '@/shared/lib/useErrorToast'

export function useQuests() {
  return useQuery({
    key: () => ['quests'],
    query: async () => {
      const { data } = await apiClient.GET('/quests')
      if (!data) throw new Error('Failed to fetch quests')
      return data
    },
  })
}

export function useClaimQuest() {
  const queryCache = useQueryCache()
  const { showError } = useErrorToast()
  return useMutation({
    mutation: async (id: string) => {
      const { data } = await apiClient.POST('/quests/{id}/claim', {
        params: { path: { id } },
      })
      if (!data) throw new Error('Failed to claim quest')
      return data
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['quests'], exact: true })
      queryCache.invalidateQueries({ key: ['rewards'], exact: true })
    },
  })
}
