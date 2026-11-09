<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'streak' | 'done' | 'gentle' | 'softrose'
  }>(),
  {
    variant: 'streak',
  },
)
</script>

<template>
  <span
    :class="[
      'font-body inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold',
      {
        'bg-apricot-tint text-apricot-deep': variant === 'streak',
        'bg-done-tint text-done': variant === 'done',
        'bg-gentle-tint text-gentle': variant === 'gentle',
        'bg-softrose-tint text-softrose': variant === 'softrose',
      },
    ]"
  >
    <slot name="icon" />
    <slot />
  </span>
</template>
