<script setup lang="ts">
withDefaults(
  defineProps<{
    value: number
    reward?: boolean
    label?: string
  }>(),
  {
    reward: false,
    label: undefined,
  },
)
</script>

<template>
  <div
    role="progressbar"
    :aria-valuenow="value"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="label"
    class="bg-sage-tint-2 h-2 overflow-hidden rounded-full"
  >
    <div
      :class="['h-full rounded-full transition-all', reward ? 'fill-reward' : 'fill-accent']"
      :style="{ width: `${Math.min(100, Math.max(0, value))}%` }"
    />
  </div>
</template>
