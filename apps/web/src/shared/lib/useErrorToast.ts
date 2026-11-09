import { ref } from 'vue'

const key = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

export function useErrorToast() {
  function showError(errorKey: string, duration = 4000) {
    key.value = errorKey
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      key.value = null
    }, duration)
  }

  function hideError() {
    if (timer) clearTimeout(timer)
    timer = null
    key.value = null
  }

  return { key, showError, hideError }
}
