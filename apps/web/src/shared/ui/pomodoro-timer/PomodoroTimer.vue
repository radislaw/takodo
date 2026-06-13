<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon } from '@/shared/ui'
import { useRecordFocus } from '@/shared/api'
import { usePomodoro } from '@/shared/lib/usePomodoro'
import { formatFocusDuration } from '@/shared/lib/formatFocus'
import { playChime } from '@/shared/lib/chime'
import { notifyTimerEnd, requestNotificationPermission } from '@/shared/lib/notifyTimerEnd'

const props = defineProps<{
  taskId: string
  focusSeconds: number
  pomodoros: number
}>()

const { t } = useI18n({ useScope: 'global' })
const { mutate: recordFocus } = useRecordFocus()

const rippling = ref(false)
let rippleTimer: ReturnType<typeof setTimeout> | null = null

function handleFlush(seconds: number, pomodoro?: boolean) {
  recordFocus({ id: props.taskId, seconds, pomodoro })
}

function handleComplete() {
  playChime()
  navigator.vibrate?.([200, 100, 200])
  void notifyTimerEnd(t('do.pomodoro.notifyTitle'), t('do.pomodoro.notifyBody'))

  if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    rippling.value = true
    rippleTimer = setTimeout(() => {
      rippling.value = false
    }, 1400)
  }
}

const { status, remaining, progress, start, pause, reset } = usePomodoro({
  onFlush: handleFlush,
  onComplete: handleComplete,
})

const minutes = computed(() => String(Math.floor(remaining.value / 60)).padStart(2, '0'))
const seconds = computed(() => String(remaining.value % 60).padStart(2, '0'))
const timeDisplay = computed(() => `${minutes.value}:${seconds.value}`)

const ringGradient = computed(() => {
  const pct = Math.round(progress.value * 100)
  const fill = pct >= 100 ? 'var(--apricot)' : 'var(--sage)'
  const track = pct >= 100 ? 'var(--apricot-tint)' : 'var(--sage-tint-2)'
  return `conic-gradient(${fill} ${pct}%, ${track} ${pct}% 100%)`
})

const MAX_TOMATOES = 5

const hasStats = computed(() => props.focusSeconds > 0 || props.pomodoros > 0)
const visibleTomatoes = computed(() => Math.min(props.pomodoros, MAX_TOMATOES))
const tomatoOverflow = computed(() => Math.max(props.pomodoros - MAX_TOMATOES, 0))
const overflowText = computed(() => `+${tomatoOverflow.value}`)
const focusTimeText = computed(() =>
  props.focusSeconds > 0 ? formatFocusDuration(props.focusSeconds, t) : '',
)

function toggleStartPause() {
  if (status.value === 'running') {
    pause()
  } else {
    void requestNotificationPermission()
    start()
  }
}

function handleReset() {
  if (rippleTimer !== null) {
    clearTimeout(rippleTimer)
    rippleTimer = null
  }
  rippling.value = false
  reset()
}

defineExpose({ flushAndReset: handleReset })
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <!-- Ring -->
    <div class="relative flex items-center justify-center">
      <div
        role="timer"
        :aria-label="t('do.pomodoro.timerAria', { time: timeDisplay })"
        class="flex h-52 w-52 items-center justify-center rounded-full"
        :style="{ background: ringGradient }"
      >
        <div class="surface-card flex h-40 w-40 flex-col items-center justify-center rounded-full">
          <span class="font-display text-ink text-4xl leading-none font-extrabold tabular-nums">
            {{ timeDisplay }}
          </span>
          <span
            v-if="status === 'running'"
            class="font-body text-sage-deep mt-1 text-xs font-semibold"
          >
            {{ t('do.subtitle') }}
          </span>
        </div>
      </div>

      <!-- Ripple circles -->
      <template v-if="rippling">
        <span class="ripple ripple-1" aria-hidden="true" />
        <span class="ripple ripple-2" aria-hidden="true" />
        <span class="ripple ripple-3" aria-hidden="true" />
      </template>
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-3">
      <AppButton
        variant="ghost"
        shape="icon-round"
        :aria-label="t('do.pomodoro.reset')"
        @click="handleReset"
      >
        <AppIcon name="rotateCcw" :size="18" />
      </AppButton>
      <AppButton
        variant="primary"
        shape="icon-round"
        class="!h-14 !w-14"
        :aria-label="status === 'running' ? t('do.pomodoro.pause') : t('do.pomodoro.start')"
        @click="toggleStartPause"
      >
        <AppIcon :name="status === 'running' ? 'pause' : 'play'" :size="22" />
      </AppButton>
      <span class="h-10 w-10" />
    </div>

    <!-- Accumulated stats -->
    <div
      v-if="hasStats"
      class="font-body text-ink-soft flex items-center gap-3 text-sm font-semibold"
    >
      <span
        v-if="pomodoros > 0"
        role="img"
        :aria-label="t('do.pomodoro.count', pomodoros)"
        class="text-apricot-deep flex items-center gap-1"
      >
        <AppIcon
          v-for="i in visibleTomatoes"
          :key="i"
          name="tomato"
          :size="22"
          aria-hidden="true"
        />
        <span v-if="tomatoOverflow > 0" aria-hidden="true">{{ overflowText }}</span>
      </span>
      <span v-if="focusTimeText" class="flex items-center gap-1">
        <AppIcon name="timer" :size="22" class="flex-shrink-0" />
        <span class="leading-none">{{ focusTimeText }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.ripple {
  position: absolute;
  border-radius: 9999px;
  border: 2px solid var(--sage);
  opacity: 0;
  pointer-events: none;
  animation: ripple-out 1.2s ease-out forwards;
}

.ripple-1 {
  width: 220px;
  height: 220px;
  animation-delay: 0ms;
}

.ripple-2 {
  width: 220px;
  height: 220px;
  animation-delay: 200ms;
}

.ripple-3 {
  width: 220px;
  height: 220px;
  animation-delay: 400ms;
}

@keyframes ripple-out {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.7);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ripple {
    display: none;
  }
}
</style>
