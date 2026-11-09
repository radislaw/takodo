<script setup lang="ts">
import AppIcon from '../icon/AppIcon.vue'
import type { IconName } from '../icon/icons'

defineProps<{
  label: string
  value: string | number
  icon?: IconName
}>()
</script>

<template>
  <div class="surface-card flex flex-col gap-1 rounded-2xl p-4 shadow-sm">
    <div class="flex items-center gap-1.5">
      <AppIcon v-if="icon" :name="icon" :size="14" class="text-ink-faint flex-shrink-0" />
      <span class="text-ink-soft text-xs font-semibold tracking-wide">{{ label }}</span>
    </div>
    <span class="font-display text-ink text-2xl leading-none font-extrabold">{{ value }}</span>
  </div>
</template>
