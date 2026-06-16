import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { apiClient } from '@/api/client'
import { useErrorToast } from '@/shared/lib/useErrorToast'
import { hasSession } from '@/shared/lib/authStorage'
type Theme =
  | 'light'
  | 'lavender'
  | 'eco'
  | 'ocean'
  | 'silent'
  | 'high-contrast'
  | 'high-contrast-dark'
  | 'dark'
  | 'forest'
  | 'lavender-dark'
  | 'ocean-dark'
  | 'silent-dark'
  | 'cyberpunk'
  | 'amber'
  | 'amber-dark'
  | 'amoled'

export function useProfile() {
  return useQuery({
    key: () => ['profile'],
    // Don't hit protected endpoints before login (avoids 401 storms on /login).
    enabled: () => hasSession(),
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
