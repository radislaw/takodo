<script setup lang="ts">
import AppIcon from '../icon/AppIcon.vue'
import type { IconName } from '../icon/icons'

withDefaults(
  defineProps<{
    tone?: 'sage' | 'apricot'
    icon?: IconName
  }>(),
  {
    tone: 'sage',
    icon: 'heart',
  },
)
</script>

<template>
  <div
    class="flex gap-3 rounded-2xl p-4"
    :class="
      tone === 'apricot' ? 'bg-apricot-tint text-apricot-deep' : 'bg-sage-tint text-sage-deep'
    "
  >
    <AppIcon :name="icon" :size="20" class="mt-0.5 flex-shrink-0" />
    <p class="text-sm leading-relaxed font-semibold"><slot /></p>
  </div>
</template>
