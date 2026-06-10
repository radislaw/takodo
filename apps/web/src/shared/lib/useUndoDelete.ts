import { ref } from 'vue'

interface PendingDelete {
  cancel: () => void
}

const pending = ref<PendingDelete | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

export function useUndoDelete() {
  function scheduleDelete(onDelete: () => void, duration = 5000) {
    if (timer) clearTimeout(timer)

    const cancel = () => {
      if (timer) clearTimeout(timer)
      timer = null
      pending.value = null
    }

    pending.value = { cancel }
    timer = setTimeout(() => {
      pending.value = null
      timer = null
      onDelete()
    }, duration)
  }

  function dismiss() {
    if (timer) clearTimeout(timer)
    timer = null
    pending.value = null
  }

  return { pending, scheduleDelete, dismiss }
}
