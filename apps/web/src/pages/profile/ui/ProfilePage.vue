<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppIcon, LevelRing } from '@/shared/ui'
import { useProfile, useUpdateProfile, useRewards } from '@/shared/api'

const { t } = useI18n({ useScope: 'global' })
const { data: profile } = useProfile()
const { mutate: updateProfile } = useUpdateProfile()
const { data: rewards } = useRewards()

type ThemeId =
  | 'light'
  | 'lavender'
  | 'cloud'
  | 'eco'
  | 'ocean'
  | 'silent'
  | 'dark'
  | 'lavender-dark'
  | 'cyberpunk'
  | 'amber'
  | 'amoled'

type A11yThemeId = 'high-contrast'

interface ThemeMeta {
  id: ThemeId | A11yThemeId
  bg: string
  accent: string
  reward: string
  border?: string
}

const THEMES: ThemeMeta[] = [
  { id: 'light', bg: '#F5F3F0', accent: '#7C9A92', reward: '#E0A87E' },
  { id: 'lavender', bg: '#F4F1F8', accent: '#8E84B8', reward: '#E0A87E' },
  { id: 'cloud', bg: '#F0EEE9', accent: '#B08968', reward: '#C8A07E' },
  { id: 'eco', bg: '#F0F1E9', accent: '#6B8A56', reward: '#C57043' },
  { id: 'ocean', bg: '#EBF1F5', accent: '#4A7A9B', reward: '#D4A96A' },
  { id: 'silent', bg: '#F2F1EF', accent: '#8E9090', reward: '#C4A78A' },
  { id: 'dark', bg: '#1A211D', accent: '#8FAEA5', reward: '#E6B088' },
  { id: 'lavender-dark', bg: '#1D1A28', accent: '#A49AD4', reward: '#E6B088' },
  { id: 'cyberpunk', bg: '#0A0820', accent: '#2F6BFF', reward: '#9D3DFF' },
  { id: 'amber', bg: '#1C1610', accent: '#C89018', reward: '#C85A28' },
  { id: 'amoled', bg: '#000000', accent: '#5AB4A0', reward: '#E09A64' },
]

const A11Y_THEMES: ThemeMeta[] = [
  { id: 'high-contrast', bg: '#FFFFFF', accent: '#0B5FD4', reward: '#B85000', border: '#000' },
]

function selectTheme(id: string) {
  updateProfile({ theme: id as ThemeId })
}
</script>

<template>
  <div class="surface-app pb-nav min-h-full">
    <div class="mx-auto max-w-xl px-5 pt-8 pb-6">
      <!-- Header -->
      <h1 class="font-display text-ink text-3xl leading-tight font-extrabold">
        {{ t('profile.title') }}
      </h1>
      <p class="font-body text-ink-soft mt-1 text-sm">{{ t('profile.subtitle') }}</p>

      <!-- Level card -->
      <div class="surface-card mt-5 flex items-center gap-5 rounded-2xl p-5 shadow-md">
        <LevelRing :level="rewards?.level ?? 1" :xp="rewards?.xp ?? 0" />
        <div>
          <div class="text-ink text-sm font-bold">
            {{ t('profile.levelRing.label') }} {{ rewards?.level ?? 1 }}
          </div>
          <div class="text-ink-soft text-xs">
            {{ t('profile.levelRing.xp', { xp: rewards?.xp ?? 0 }) }}
          </div>
        </div>
      </div>

      <!-- Theme card -->
      <div class="surface-card mt-5 rounded-2xl p-5 shadow-md">
        <div class="mb-4 flex items-center gap-3">
          <div
            class="bg-sage-tint text-sage-deep flex h-10 w-10 items-center justify-center rounded-[11px]"
          >
            <AppIcon name="eye" :size="20" />
          </div>
          <div>
            <div class="text-ink text-sm font-bold">{{ t('profile.theme.label') }}</div>
            <div class="text-ink-soft text-xs">{{ t('profile.theme.sub') }}</div>
          </div>
        </div>

        <!-- Regular themes -->
        <div class="flex flex-wrap gap-x-2 gap-y-4">
          <button
            v-for="th in THEMES"
            :key="th.id"
            type="button"
            class="flex w-14 cursor-pointer flex-col items-center gap-1.5 rounded-lg border-none bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-offset-2"
            :aria-label="t('profile.themes.' + th.id)"
            :aria-pressed="profile?.theme === th.id"
            @click="selectTheme(th.id)"
          >
            <div
              class="relative box-border flex h-14 w-14 items-end rounded-[15px] p-2"
              :style="{
                background: th.bg,
                border: th.border ? `1px solid ${th.border}` : '1px solid rgba(0,0,0,.1)',
                boxShadow:
                  profile?.theme === th.id ? '0 0 0 2.5px var(--sage)' : 'var(--shadow-sm)',
              }"
            >
              <span class="h-2.5 w-6 rounded-full" :style="{ background: th.accent }" />
              <span
                class="absolute top-2 right-2 h-3 w-3 rounded-full"
                :style="{ background: th.reward }"
              />
              <span
                v-if="profile?.theme === th.id"
                class="bg-sage absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full shadow-sm"
              >
                <AppIcon name="check" :size="12" color="#fff" :stroke-width="3" />
              </span>
            </div>
            <span
              class="text-center text-[11px] font-bold whitespace-nowrap"
              :class="profile?.theme === th.id ? 'text-ink' : 'text-ink-soft'"
            >
              {{ t(`profile.themes.${th.id}`) }}
            </span>
          </button>
        </div>
      </div>

      <!-- A11y section -->
      <p class="font-body text-ink-soft mt-5 mb-3 text-xs font-semibold tracking-widest uppercase">
        {{ t('profile.theme.a11yLabel') }}
      </p>
      <div class="surface-card rounded-2xl p-5 shadow-md">
        <div class="flex flex-wrap gap-x-2 gap-y-4">
          <button
            v-for="th in A11Y_THEMES"
            :key="th.id"
            type="button"
            class="flex w-14 cursor-pointer flex-col items-center gap-1.5 rounded-lg border-none bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-offset-2"
            :aria-label="t('profile.themes.' + th.id)"
            :aria-pressed="profile?.theme === th.id"
            @click="selectTheme(th.id)"
          >
            <div
              class="relative box-border flex h-14 w-14 items-end rounded-[15px] p-2"
              :style="{
                background: th.bg,
                border: th.border ? `1px solid ${th.border}` : '1px solid rgba(0,0,0,.1)',
                boxShadow:
                  profile?.theme === th.id ? '0 0 0 2.5px var(--sage)' : 'var(--shadow-sm)',
              }"
            >
              <span class="h-2.5 w-6 rounded-full" :style="{ background: th.accent }" />
              <span
                class="absolute top-2 right-2 h-3 w-3 rounded-full"
                :style="{ background: th.reward }"
              />
              <span
                v-if="profile?.theme === th.id"
                class="bg-sage absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full shadow-sm"
              >
                <AppIcon name="check" :size="12" color="#fff" :stroke-width="3" />
              </span>
            </div>
            <span
              class="text-center text-[11px] font-bold whitespace-nowrap"
              :class="profile?.theme === th.id ? 'text-ink' : 'text-ink-soft'"
            >
              {{ t(`profile.themes.${th.id}`) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Gentle note -->
      <div class="bg-sage-tint mt-5 flex gap-3 rounded-2xl p-4">
        <AppIcon name="heart" :size="20" class="text-sage-deep mt-0.5 flex-shrink-0" />
        <p class="text-sage-deep text-sm leading-relaxed font-semibold">
          {{ t('rewards.gentleNote') }}
        </p>
      </div>
    </div>
  </div>
</template>
