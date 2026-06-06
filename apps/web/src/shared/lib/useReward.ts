import { ref } from 'vue'

const isVisible = ref(false)

export function useReward() {
  function celebrate() {
    isVisible.value = true
  }

  function hide() {
    isVisible.value = false
  }

  return { isVisible, celebrate, hide }
}
