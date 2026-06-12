import { useQuery } from '@pinia/colada'
import { apiClient } from '@/api/client'
import { todayDate } from './daily'

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

// Fetch a full year; the component shows as many trailing columns as fit the width.
const HEATMAP_DEFAULT_WEEKS = 53

export function useHeatmap(weeks = HEATMAP_DEFAULT_WEEKS) {
  return useQuery({
    key: () => ['rewards', 'heatmap', weeks],
    query: async () => {
      const { data } = await apiClient.GET('/rewards/heatmap', {
        params: { query: { weeks, date: todayDate() } },
      })
      if (!data) throw new Error('Failed to fetch heatmap')
      return data
    },
  })
}
