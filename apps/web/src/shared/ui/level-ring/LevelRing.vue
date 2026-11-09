<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  level: number
  xp: number
}>()

const { t } = useI18n({ useScope: 'global' })

const SIZE = 72
const STROKE = 6
const R = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * R

const progress = computed(() => {
  const xpStart = (props.level - 1) ** 2 * 100
  const xpEnd = props.level ** 2 * 100
  const range = xpEnd - xpStart
  if (range === 0) return 1
  return Math.min(1, Math.max(0, (props.xp - xpStart) / range))
})

const dashOffset = computed(() => CIRCUMFERENCE * (1 - progress.value))
</script>

<template>
  <div
    data-test="level-ring"
    class="flex flex-col items-center gap-1"
    :aria-label="t('profile.levelRing.aria', { level: props.level, xp: props.xp })"
  >
    <svg
      :width="SIZE"
      :height="SIZE"
      :viewBox="`0 0 ${SIZE} ${SIZE}`"
      fill="none"
      aria-hidden="true"
    >
      <!-- Track -->
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="R"
        :stroke-width="STROKE"
        stroke="var(--sage-tint-2)"
        fill="none"
      />
      <!-- Progress arc -->
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="R"
        :stroke-width="STROKE"
        stroke="var(--sage)"
        fill="none"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="dashOffset"
        transform="rotate(-90)"
        :transform-origin="`${SIZE / 2} ${SIZE / 2}`"
      />
      <!-- Level number -->
      <text
        :x="SIZE / 2"
        :y="SIZE / 2 + 1"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="20"
        font-weight="800"
        fill="var(--ink)"
        font-family="var(--font-display)"
        data-test="level-number"
      >
        {{ props.level }}
      </text>
    </svg>
    <span class="text-ink-soft text-[11px] font-semibold" data-test="xp-value">
      {{ t('profile.levelRing.xp', { xp: props.xp }) }}
    </span>
  </div>
</template>
