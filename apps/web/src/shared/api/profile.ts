import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { apiClient } from '@/api/client'
import { useErrorToast } from '@/shared/lib/useErrorToast'
type Theme =
  | 'light'
  | 'lavender'
  | 'cloud'
  | 'eco'
  | 'ocean'
  | 'silent'
  | 'high-contrast'
  | 'high-contrast-dark'
  | 'dark'
  | 'forest'
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
  const { showError } = useErrorToast()
  return useMutation({
    mutation: async (body: {
      name?: string
      theme?: Theme
      notifMorning?: boolean
      notifEvening?: boolean
      gender?: string
      birthDate?: string
      timezone?: string
      adhdStatus?: string
      language?: string
    }) => {
      const { data } = await apiClient.PATCH('/me', { body })
      if (!data) throw new Error('Failed to update profile')
      return data
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSettled: () => {
      queryCache.invalidateQueries({ key: ['profile'], exact: true })
    },
  })
}
