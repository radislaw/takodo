import { useMutation } from '@pinia/colada'
import { apiClient } from '@/api/client'
import { useErrorToast } from '@/shared/lib/useErrorToast'
import { useSuccessToast } from '@/shared/lib/useSuccessToast'

export type FeedbackKind = 'review' | 'wish' | 'support'

export function useSubmitFeedback() {
  const { showError } = useErrorToast()
  const { showSuccess } = useSuccessToast()
  return useMutation({
    mutation: async (body: { kind: FeedbackKind; message: string; rating?: number }) => {
      const { data } = await apiClient.POST('/feedback', { body })
      if (!data) throw new Error('Failed to submit feedback')
      return data
    },
    onError: () => {
      showError('errors.saveFailed')
    },
    onSuccess: () => {
      showSuccess('profile.feedback.success')
    },
  })
}
