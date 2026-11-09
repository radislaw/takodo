<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'md' | 'sm'
    shape?: 'fab' | 'icon' | 'icon-round'
    disabled?: boolean
    ariaLabel?: string
  }>(),
  {
    variant: 'primary',
    size: 'md',
    disabled: false,
    shape: undefined,
    ariaLabel: undefined,
  },
)

defineEmits<{ click: [e: MouseEvent] }>()
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :class="[
      'font-body inline-flex cursor-pointer items-center justify-center gap-2 border-none font-bold outline-none',
      'focus-visible:shadow-ring',
      'disabled:cursor-not-allowed disabled:opacity-40',
      {
        // variant styles
        'fill-accent rounded-2xl px-5 text-sm text-white shadow-[0_4px_14px_rgba(124,154,146,0.28)]':
          variant === 'primary' && !shape,
        'text-sage-deep border-sage rounded-2xl border bg-transparent px-5 text-sm':
          variant === 'secondary' && !shape,
        'text-ink rounded-2xl border-none bg-transparent px-4 text-sm':
          variant === 'ghost' && !shape,
        'bg-softrose-tint text-softrose border-softrose rounded-2xl border px-5 text-sm':
          variant === 'danger' && !shape,
        // size
        'py-3': size === 'md' && !shape,
        '!rounded-xl py-2 !text-xs': size === 'sm' && !shape,
        // shapes
        'fill-accent h-14 w-14 rounded-full border-none p-0 text-white shadow-[0_6px_18px_rgba(124,154,146,0.42)]':
          shape === 'fab',
        'bg-cream-deep text-ink-soft h-10 w-10 rounded-lg border-none p-0': shape === 'icon',
        'bg-cream-deep text-ink-soft h-10 w-10 rounded-full border-none p-0':
          shape === 'icon-round',
      },
    ]"
    v-on="{ click: (e: MouseEvent) => $emit('click', e) }"
  >
    <slot />
  </button>
</template>
