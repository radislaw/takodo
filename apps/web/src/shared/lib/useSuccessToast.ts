import { ref } from 'vue'

const key = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

export function useSuccessToast() {
  function showSuccess(messageKey: string, duration = 3000) {
    key.value = messageKey
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      key.value = null
    }, duration)
  }

  function hideSuccess() {
    if (timer) clearTimeout(timer)
    timer = null
    key.value = null
  }

  return { key, showSuccess, hideSuccess }
}
