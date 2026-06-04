<script setup lang="ts">
import { computed } from 'vue'
import { IC, type IconName } from './icons'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
    color?: string
    strokeWidth?: number
    title?: string
  }>(),
  {
    size: 20,
    color: 'currentColor',
    strokeWidth: 2,
    title: undefined,
  },
)

const hasCircle = computed(() => ['award', 'sun', 'eye'].includes(props.name))
const circleAttrs = computed(() => {
  if (props.name === 'award') return { cx: 12, cy: 8, r: 6 }
  if (props.name === 'sun') return { cx: 12, cy: 12, r: 4 }
  return { cx: 12, cy: 12, r: 3 }
})
const isDecorative = computed(() => !props.title)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="isDecorative ? 'true' : undefined"
    :role="isDecorative ? undefined : 'img'"
    focusable="false"
  >
    <title v-if="title">{{ title }}</title>
    <path v-if="IC[name]" :d="IC[name]" />
    <circle v-if="hasCircle" v-bind="circleAttrs" />
  </svg>
</template>
