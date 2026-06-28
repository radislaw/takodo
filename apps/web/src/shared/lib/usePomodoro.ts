import { ref, computed, onUnmounted } from 'vue'

export const FOCUS_SECONDS = 1500

export type PomodoroStatus = 'idle' | 'running' | 'paused'

export interface UsePomodoroOptions {
  onFlush: (seconds: number, pomodoro?: boolean) => void
  onComplete: () => void
}

export function usePomodoro({ onFlush, onComplete }: UsePomodoroOptions) {
  const status = ref<PomodoroStatus>('idle')
  const accumulatedMs = ref(0)
  const startedAtMs = ref(0)
  const flushedSeconds = ref(0)
  const nowMs = ref(Date.now())

  let interval: ReturnType<typeof setInterval> | null = null

  const elapsedMs = computed(() => {
    if (status.value === 'running') {
      return accumulatedMs.value + (nowMs.value - startedAtMs.value)
    }
    return accumulatedMs.value
  })

  const remaining = computed(() => {
    const elapsed = Math.floor(elapsedMs.value / 1000)
    return Math.max(0, FOCUS_SECONDS - elapsed)
  })

  const progress = computed(() => {
    return (FOCUS_SECONDS - remaining.value) / FOCUS_SECONDS
  })

  function clearInterval_() {
    if (interval !== null) {
      clearInterval(interval)
      interval = null
    }
  }

  function flush(pomodoro?: boolean) {
    const elapsed = Math.floor(elapsedMs.value / 1000)
    const unflushed = elapsed - flushedSeconds.value
    if (unflushed >= 1) {
      onFlush(unflushed, pomodoro)
      flushedSeconds.value = elapsed
    }
  }

  function finish() {
    clearInterval_()
    flush(true)
    status.value = 'idle'
    accumulatedMs.value = 0
    startedAtMs.value = 0
    flushedSeconds.value = 0
    nowMs.value = Date.now()
    onComplete()
  }

  function start() {
    if (status.value === 'running') return
    startedAtMs.value = Date.now()
    nowMs.value = startedAtMs.value
    status.value = 'running'
    interval = setInterval(() => {
      nowMs.value = Date.now()
      if (remaining.value <= 0) {
        finish()
      }
    }, 1000)
  }

  function pause() {
    if (status.value !== 'running') return
    clearInterval_()
    accumulatedMs.value = accumulatedMs.value + (Date.now() - startedAtMs.value)
    status.value = 'paused'
    flush()
  }

  function reset() {
    clearInterval_()
    flush()
    accumulatedMs.value = 0
    startedAtMs.value = 0
    flushedSeconds.value = 0
    nowMs.value = Date.now()
    status.value = 'idle'
  }

  onUnmounted(() => {
    clearInterval_()
    flush()
  })

  return {
    status,
    remaining,
    progress,
    start,
    pause,
    flush,
    reset,
  }
}
