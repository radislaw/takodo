<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/ui'
import { isDarkTheme, pairedTheme } from '@/shared/lib/themePairs'

const props = defineProps<{ theme: string }>()
const emit = defineEmits<{ select: [theme: string] }>()

const { t } = useI18n({ useScope: 'global' })

const dark = computed(() => isDarkTheme(props.theme))
// Dark themes show a sun (tap → light); light themes show a moon (tap → dark).
const icon = computed(() => (dark.value ? 'sun' : 'moon'))
const label = computed(() => (dark.value ? t('themeToggle.toLight') : t('themeToggle.toDark')))

function toggle() {
  emit('select', pairedTheme(props.theme))
}
</script>

<template>
  <button
    type="button"
    data-test="theme-toggle"
    class="surface-card border-line text-ink-soft hover:text-ink fixed top-[calc(0.75rem+env(safe-area-inset-top))] right-3 z-40 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-md transition-colors"
    :aria-label="label"
    :aria-pressed="dark"
    @click="toggle"
  >
    <AppIcon :name="icon" :size="18" />
  </button>
</template>
