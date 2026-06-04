<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
    light?: boolean
  }>(),
  {
    size: 28,
    light: false,
  },
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M4 20 L10 26 L22 14"
      :stroke="light ? 'rgba(255,255,255,.3)' : '#2C3A33'"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M6 14 L12 20 L24 8"
      stroke="var(--sage)"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M8 8  L14 14 L26 2"
      stroke="var(--sage-tint-2)"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
