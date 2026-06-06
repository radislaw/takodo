import { useQuery } from '@pinia/colada'
import { apiClient } from '@/api/client'

export function useFrequent(minDays = 1) {
  return useQuery({
    key: () => ['frequent', minDays],
    query: async () => {
      const { data } = await apiClient.GET('/frequent', {
        params: { query: { minDays } },
      })
      if (!data) throw new Error('Failed to fetch frequent tasks')
      return data
    },
  })
}
