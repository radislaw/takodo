<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/ui'

const props = defineProps<{
  id: string
  bg: string
  accent: string
  reward: string
  border?: string
  active: boolean
  locked: boolean
  lockedLevel?: number
  /** When true the lock is a first-task gift, not a level gate. */
  lockFirstTask?: boolean
  /** Short display label override (e.g. "Светлая") — falls back to the theme name. */
  label?: string
}>()

const emit = defineEmits<{ select: [id: string] }>()

const { t } = useI18n({ useScope: 'global' })

function ariaLabel(): string {
  const name = t('profile.themes.' + props.id)
  if (props.lockFirstTask) return t('profile.theme.lockedFirstTaskAria', { name })
  if (props.locked) return t('profile.theme.lockedAria', { name, level: props.lockedLevel })
  return name
}

function bottomLabel(): string {
  if (props.lockFirstTask) return t('profile.theme.lockedFirstTask')
  if (props.locked) return t('profile.theme.lockedLevel', { n: props.lockedLevel })
  return props.label ?? t(`profile.themes.${props.id}`)
}
</script>

<template>
  <button
    type="button"
    :data-test="`theme-${id}`"
    class="flex w-14 flex-col items-center gap-1.5 rounded-lg border-none bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-offset-2"
    :class="locked ? 'cursor-not-allowed' : 'cursor-pointer'"
    :disabled="locked"
    :aria-label="ariaLabel()"
    :aria-pressed="active"
    @click="emit('select', id)"
  >
    <div
      class="relative box-border flex h-14 w-14 items-end rounded-[15px] p-2"
      :class="{ 'opacity-50': locked }"
      :style="{
        background: bg,
        border: border ? `1px solid ${border}` : '1px solid rgba(0,0,0,.1)',
        boxShadow: active ? '0 0 0 2.5px var(--sage)' : 'var(--shadow-sm)',
      }"
    >
      <span class="h-2.5 w-6 rounded-full" :style="{ background: accent }" />
      <span class="absolute top-2 right-2 h-3 w-3 rounded-full" :style="{ background: reward }" />
      <span
        v-if="active"
        class="bg-sage absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full shadow-sm"
      >
        <AppIcon name="check" :size="12" color="#fff" :stroke-width="3" />
      </span>
      <span
        v-else-if="lockFirstTask"
        data-test="theme-gift"
        class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] shadow-sm"
        aria-hidden="true"
        >{{ t('profile.theme.lockedFirstTask') }}</span
      >
      <span
        v-else-if="locked"
        data-test="theme-lock"
        class="bg-ink-soft absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full shadow-sm"
      >
        <AppIcon name="lock" :size="11" color="#fff" :stroke-width="2.5" />
      </span>
    </div>
    <span
      class="w-14 truncate text-center text-[11px] leading-tight font-bold"
      :class="active ? 'text-ink' : 'text-ink-soft'"
    >
      {{ bottomLabel() }}
    </span>
  </button>
</template>
