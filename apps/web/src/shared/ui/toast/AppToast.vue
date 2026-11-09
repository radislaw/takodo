<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'dark' | 'sage' | 'gentle'
  }>(),
  {
    variant: 'dark',
  },
)
</script>

<template>
  <div
    :role="variant === 'gentle' ? 'alert' : 'status'"
    :aria-live="variant === 'gentle' ? 'assertive' : 'polite'"
    :class="[
      'font-body shadow-pop inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold',
      {
        'bg-ink text-white': variant === 'dark',
        'bg-sage text-white': variant === 'sage',
        'bg-gentle-tint text-gentle': variant === 'gentle',
      },
    ]"
  >
    <slot name="icon" />
    <slot />
  </div>
</template>
