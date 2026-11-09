import { ref } from 'vue'

const isVisible = ref(false)
const isEpic = ref(false)

export function useReward() {
  function celebrate(opts?: { epic?: boolean }) {
    isEpic.value = opts?.epic ?? false
    isVisible.value = true
  }

  function hide() {
    isVisible.value = false
    isEpic.value = false
  }

  return { isVisible, isEpic, celebrate, hide }
}
