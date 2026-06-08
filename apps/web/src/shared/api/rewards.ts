import { useQuery } from '@pinia/colada'
import { apiClient } from '@/api/client'

export function useRewards() {
  return useQuery({
    key: () => ['rewards'],
    query: async () => {
      const { data } = await apiClient.GET('/rewards')
      if (!data) throw new Error('Failed to fetch rewards')
      return data
    },
  })
}
