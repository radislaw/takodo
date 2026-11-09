import { useMutation } from '@pinia/colada'
import { useErrorToast } from '@/shared/lib/useErrorToast'

export function useAppMutation<TData, TVariables>(opts: {
  mutation: (vars: TVariables) => Promise<TData>
  onMutate?: (vars: TVariables) => void
  onSuccess?: (data: TData, vars: TVariables) => void
  onError?: (err: unknown, vars: TVariables) => boolean | void
  onSettled?: (data: TData | undefined, err: unknown, vars: TVariables) => void
}) {
  const { showError } = useErrorToast()
  return useMutation({
    mutation: opts.mutation,
    onMutate: opts.onMutate,
    onSuccess: opts.onSuccess,
    onError: (err, vars) => {
      const suppress = opts.onError?.(err, vars)
      if (!suppress) showError('errors.saveFailed')
    },
    onSettled: opts.onSettled,
  })
}
