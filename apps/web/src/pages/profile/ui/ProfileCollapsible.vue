<script setup lang="ts">
import { ref } from 'vue'
import { AppIcon, type IconName } from '@/shared/ui'

withDefaults(
  defineProps<{
    icon: IconName
    label: string
    sub?: string
  }>(),
  { sub: undefined },
)

const open = ref(false)
</script>

<template>
  <div class="surface-card mt-5 rounded-2xl p-5 shadow-md">
    <button
      type="button"
      class="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-offset-2"
      :aria-expanded="open"
      @click="open = !open"
    >
      <div
        class="bg-sage-tint text-sage-deep flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px]"
      >
        <AppIcon :name="icon" :size="20" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="text-ink text-sm font-bold">{{ label }}</div>
        <div v-if="sub" class="text-ink-soft text-xs">{{ sub }}</div>
      </div>
      <AppIcon
        name="chevronR"
        :size="18"
        class="text-ink-faint flex-shrink-0 transition-transform"
        :class="open ? 'rotate-90' : ''"
      />
    </button>

    <div v-if="open" class="mt-4">
      <slot />
    </div>
  </div>
</template>
