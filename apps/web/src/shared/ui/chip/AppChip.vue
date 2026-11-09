<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    active?: boolean
    dotColor?: string
  }>(),
  {
    active: false,
    label: undefined,
    dotColor: undefined,
  },
)

defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    :aria-pressed="active"
    :class="[
      'font-body inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3 py-2 text-sm font-semibold transition-colors',
      active
        ? 'bg-sage-tint text-sage-deep border-sage'
        : 'bg-cream-deep text-ink-soft border-line',
    ]"
    @click="$emit('click')"
  >
    <span
      v-if="dotColor"
      class="h-2 w-2 flex-shrink-0 rounded-full"
      :style="{ background: dotColor }"
      aria-hidden="true"
    />
    <slot>{{ label }}</slot>
  </button>
</template>
