<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    done: number
    total: number
    reward?: boolean
    label?: string
  }>(),
  {
    reward: false,
    label: undefined,
  },
)

const { t } = useI18n()

const pct = computed(() => (props.total ? Math.round((props.done / props.total) * 100) : 0))
const isReward = computed(() => props.reward || pct.value >= 100)
const fill = computed(() => (isReward.value ? 'var(--apricot)' : 'var(--sage)'))
const track = computed(() => (isReward.value ? 'var(--apricot-tint)' : 'var(--sage-tint-2)'))
const conicGradient = computed(
  () => `conic-gradient(${fill.value} ${pct.value}%, ${track.value} ${pct.value}% 100%)`,
)
</script>

<template>
  <div
    role="progressbar"
    :aria-valuenow="done"
    aria-valuemin="0"
    :aria-valuemax="total"
    :aria-label="label ?? t('progressRing.aria', { done, total })"
    class="flex h-[68px] w-[68px] flex-shrink-0 items-center justify-center rounded-full"
    :style="{ background: conicGradient }"
  >
    <div
      class="surface-card flex h-[50px] w-[50px] flex-col items-center justify-center rounded-full"
    >
      <span class="font-display text-ink text-sm leading-none font-extrabold">
        {{ done }}/{{ total }}
      </span>
      <span class="text-ink-soft mt-px text-[8.5px] font-semibold">
        <slot>{{ t('progressRing.default') }}</slot>
      </span>
    </div>
  </div>
</template>
