<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '../icon/AppIcon.vue'

const { t } = useI18n({ useScope: 'global' })

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    showBack?: boolean
    sticky?: boolean
  }>(),
  { sticky: true, subtitle: undefined, showBack: false },
)

const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <header
    class="surface-card border-line border-b shadow-sm"
    :class="sticky ? 'sticky top-0 z-10' : ''"
  >
    <div class="flex items-center gap-3 px-5 py-4">
      <button
        v-if="showBack"
        type="button"
        class="text-ink-soft hover:text-ink -ml-1 flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center"
        :aria-label="t('a11y.back')"
        @click="emit('back')"
      >
        <AppIcon name="chevronR" :size="22" style="transform: rotate(180deg)" />
      </button>
      <div class="min-w-0 flex-1">
        <h1 class="font-display text-ink text-xl leading-tight font-extrabold">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="text-ink-soft mt-0.5 text-xs">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-shrink-0 items-center gap-1">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
