<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
  }>(),
  {
    title: undefined,
    subtitle: undefined,
  },
)
</script>

<template>
  <!-- dialog semantics (aria-modal, focus-trap) deferred until overlay behavior is added -->
  <div class="surface-card shadow-pop rounded-t-[22px] px-4 pt-3 pb-6">
    <div class="bg-line-strong mx-auto mb-4 h-1 w-9 rounded-full" aria-hidden="true" />
    <h2 v-if="title" class="font-display text-ink text-lg leading-tight font-extrabold">
      {{ title }}
    </h2>
    <p v-if="subtitle" class="text-ink-soft font-body mt-1 mb-3 text-xs">
      {{ subtitle }}
    </p>
    <slot />
  </div>
</template>
