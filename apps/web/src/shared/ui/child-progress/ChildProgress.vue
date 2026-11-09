<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Compact donut + count for parent→child progress in dense rows (Today / Tasks
// list). The big hero variant on the task detail page uses AppProgressRing — both
// speak the same "ring" language so progress looks consistent across screens.
const props = defineProps<{
  done: number
  total: number
  label?: string
}>()

const { t } = useI18n({ useScope: 'global' })

const pct = computed(() => (props.total ? Math.round((props.done / props.total) * 100) : 0))
const isComplete = computed(() => props.total > 0 && props.done >= props.total)
const fill = computed(() => (isComplete.value ? 'var(--apricot)' : 'var(--sage)'))
const track = computed(() => (isComplete.value ? 'var(--apricot-tint)' : 'var(--sage-tint-2)'))
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
    class="flex items-center gap-1.5"
  >
    <span
      class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
      :style="{ background: conicGradient }"
    >
      <span class="surface-card h-2 w-2 rounded-full" />
    </span>
    <span class="text-ink-soft text-xs font-semibold">{{ done }}/{{ total }}</span>
  </div>
</template>
