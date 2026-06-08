import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { apiClient } from '@/api/client'
type Theme =
  | 'light'
  | 'lavender'
  | 'cloud'
  | 'eco'
  | 'ocean'
  | 'silent'
  | 'high-contrast'
  | 'dark'
  | 'lavender-dark'
  | 'cyberpunk'
  | 'amber'
  | 'amoled'

export function useProfile() {
  return useQuery({
    key: () => ['profile'],
    query: async () => {
      const { data } = await apiClient.GET('/me')
      if (!data) throw new Error('Failed to fetch profile')
      return data
    },
  })
}

export function useUpdateProfile() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: async (body: { name?: string; theme?: Theme }) => {
      const { data } = await apiClient.PATCH('/me', { body })
      if (!data) throw new Error('Failed to update profile')
      return data
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['profile'], exact: true })
    },
  })
}
