<script setup lang="ts">
import AppIcon from '../icon/AppIcon.vue'

const model = defineModel<boolean>({ default: false })

withDefaults(
  defineProps<{
    reward?: boolean
    size?: number
    label?: string
  }>(),
  {
    reward: false,
    size: 27,
    label: undefined,
  },
)
</script>

<template>
  <label
    class="inline-flex cursor-pointer items-center gap-2 select-none"
    :style="{ minHeight: '44px' }"
  >
    <input v-model="model" type="checkbox" class="sr-only" v-bind="$attrs" />
    <span
      :style="{ width: `${size}px`, height: `${size}px` }"
      :class="[
        'inline-flex flex-shrink-0 items-center justify-center rounded-full',
        model
          ? reward
            ? 'fill-reward shadow-[0_3px_10px_rgba(224,168,126,0.45)]'
            : 'fill-accent'
          : 'border-line-strong surface-card border-2',
      ]"
      aria-hidden="true"
    >
      <AppIcon
        v-if="model"
        name="check"
        :size="Math.round(size * 0.55)"
        color="#fff"
        :stroke-width="3"
      />
    </span>
    <span v-if="label" class="font-body text-ink text-sm font-semibold">{{ label }}</span>
    <slot v-else />
  </label>
</template>
