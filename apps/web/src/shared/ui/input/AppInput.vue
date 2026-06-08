<script setup lang="ts">
import { useId, ref } from 'vue'

const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    disabled?: boolean
    multiline?: boolean
    rows?: number
  }>(),
  {
    rows: 3,
    disabled: false,
    multiline: false,
    label: undefined,
    hint: undefined,
    error: undefined,
    placeholder: undefined,
  },
)

const id = useId()
const hintId = `${id}-hint`
const errorId = `${id}-error`

const inputEl = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
defineExpose({ focus: () => inputEl.value?.focus() })
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="id" class="text-ink-soft font-body text-xs font-semibold">
      {{ label }}
    </label>

    <textarea
      v-if="multiline"
      :id="id"
      ref="inputEl"
      v-model="model"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-describedby="
        [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined
      "
      :aria-invalid="error ? 'true' : undefined"
      class="font-body text-ink bg-cream-deep border-line placeholder:text-ink-faint focus:border-sage focus:shadow-ring focus:surface-card w-full resize-y rounded-xl border-[1.5px] px-3 py-3 text-sm leading-relaxed outline-none disabled:cursor-not-allowed disabled:opacity-45"
      :class="{ 'border-softrose focus:shadow-ring-apr': error }"
    />

    <input
      v-else
      :id="id"
      ref="inputEl"
      v-model="model"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-describedby="
        [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined
      "
      :aria-invalid="error ? 'true' : undefined"
      class="font-body text-ink bg-cream-deep border-line placeholder:text-ink-faint focus:border-sage focus:shadow-ring focus:surface-card w-full rounded-xl border-[1.5px] px-3 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-45"
      :class="{ 'border-softrose focus:shadow-ring-apr': error }"
    />

    <p v-if="hint && !error" :id="hintId" class="text-ink-faint font-body text-xs">
      {{ hint }}
    </p>

    <p
      v-if="error"
      :id="errorId"
      role="alert"
      aria-live="polite"
      class="text-softrose font-body text-xs"
    >
      {{ error }}
    </p>
  </div>
</template>
