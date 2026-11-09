<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/ui'
import { useProfile, useUpdateProfile, useRewards, useNotifications, useLogout } from '@/shared/api'
import { isThemeUnlocked, isFirstTaskTheme, themeUnlockLevel } from '@/shared/lib/unlocks'
import { TIMEZONE_IDS, detectTimezone, formatTimezoneLabel } from '@/shared/lib/timezones'
import ThemeSwatch from './ThemeSwatch.vue'
import ProfileSurvey from './ProfileSurvey.vue'
import ProfileFeedback from './ProfileFeedback.vue'
import ProfileCollapsible from './ProfileCollapsible.vue'

const { t } = useI18n({ useScope: 'global' })
const { data: profile } = useProfile()
const { mutate: updateProfile } = useUpdateProfile()
const { data: rewards } = useRewards()
const { mutate: logout } = useLogout()

const level = computed(() => rewards.value?.level ?? 1)
const firstTaskDone = computed(
  () => rewards.value?.badges?.find((b) => b.id === 'first_step')?.earned ?? false,
)
const unlockState = computed(() => ({ level: level.value, firstTaskDone: firstTaskDone.value }))

// Timezone: friendly select; auto-detect and persist once when the user has none.
const detectedTz = detectTimezone()
const currentTz = computed(() => profile.value?.timezone ?? detectedTz ?? '')
const timezoneOptions = computed(() => {
  const ids = [...TIMEZONE_IDS] as string[]
  if (currentTz.value && !ids.includes(currentTz.value)) ids.unshift(currentTz.value)
  return ids.map((id) => ({ id, label: formatTimezoneLabel(id) }))
})

let autoSetTz = false
watch(
  profile,
  (p) => {
    if (autoSetTz || !p) return
    if (!p.timezone && detectedTz) {
      autoSetTz = true
      updateProfile({ timezone: detectedTz })
    }
  },
  { immediate: true },
)

function isLocked(id: string): boolean {
  return !isThemeUnlocked(id, unlockState.value)
}

function isGiftLock(id: string): boolean {
  return isFirstTaskTheme(id) && isLocked(id)
}

type ThemeId =
  | 'light'
  | 'lavender'
  | 'eco'
  | 'ocean'
  | 'silent'
  | 'dark'
  | 'forest'
  | 'lavender-dark'
  | 'ocean-dark'
  | 'silent-dark'
  | 'cyberpunk'
  | 'amber'
  | 'amber-dark'
  | 'amoled'

type A11yThemeId = 'high-contrast' | 'high-contrast-dark'

interface ThemeMeta {
  id: ThemeId | A11yThemeId
  bg: string
  accent: string
  reward: string
  border?: string
}

interface ThemeGroup {
  key: string
  light: ThemeMeta
  dark: ThemeMeta
}

const M = {
  light: {
    id: 'light',
    bg: 'linear-gradient(135deg, #DCEAFF 0%, #F3E3F7 55%, #DFF0F4 100%)',
    accent: '#4F8FDD',
    reward: '#E89A6E',
  },
  dark: {
    id: 'dark',
    bg: 'linear-gradient(135deg, #131A2E 0%, #261632 55%, #122230 100%)',
    accent: '#6DA3E8',
    reward: '#EBA87C',
  },
  lavender: {
    id: 'lavender',
    bg: 'linear-gradient(135deg, #E8E0F4 0%, #F8E4F4 55%, #EEEAFF 100%)',
    accent: '#8E84B8',
    reward: '#E0A87E',
  },
  'lavender-dark': {
    id: 'lavender-dark',
    bg: 'linear-gradient(135deg, #141220 0%, #261534 55%, #1C1830 100%)',
    accent: '#A49AD4',
    reward: '#E6B088',
  },
  eco: {
    id: 'eco',
    bg: 'linear-gradient(135deg, #DDE8D2 0%, #F5F2E4 55%, #EBEEDC 100%)',
    accent: '#6B8A56',
    reward: '#C57043',
  },
  forest: {
    id: 'forest',
    bg: 'linear-gradient(135deg, #121A14 0%, #1E2414 55%, #172018 100%)',
    accent: '#8FAEA5',
    reward: '#E6B088',
  },
  ocean: {
    id: 'ocean',
    bg: 'linear-gradient(135deg, #C8E8F0 0%, #EAF8F5 55%, #DAF0F8 100%)',
    accent: '#2E8FA8',
    reward: '#E07050',
  },
  'ocean-dark': {
    id: 'ocean-dark',
    bg: 'linear-gradient(135deg, #0A1820 0%, #102832 55%, #0C2230 100%)',
    accent: '#3AAFC8',
    reward: '#E88868',
  },
  silent: {
    id: 'silent',
    bg: 'linear-gradient(135deg, #EAE9E6 0%, #F2F0ED 55%, #F0EDEA 100%)',
    accent: '#8E9090',
    reward: '#C4A78A',
  },
  'silent-dark': {
    id: 'silent-dark',
    bg: 'linear-gradient(135deg, #1A1A18 0%, #1E1D1B 55%, #1C1B19 100%)',
    accent: '#9CA09F',
    reward: '#C4A78A',
  },
  amber: {
    id: 'amber',
    bg: 'linear-gradient(135deg, #F6ECD6 0%, #F8EED8 55%, #F6ECD8 100%)',
    accent: '#B87E10',
    reward: '#C85A28',
  },
  'amber-dark': {
    id: 'amber-dark',
    bg: 'linear-gradient(135deg, #161008 0%, #281600 55%, #201808 100%)',
    accent: '#C89018',
    reward: '#C85A28',
  },
} as const satisfies Record<string, ThemeMeta>

const THEME_GROUPS: ThemeGroup[] = [
  { key: 'classic', light: M.light, dark: M.dark },
  { key: 'lavender', light: M.lavender, dark: M['lavender-dark'] },
  { key: 'eco', light: M.eco, dark: M.forest },
  { key: 'ocean', light: M.ocean, dark: M['ocean-dark'] },
  { key: 'silent', light: M.silent, dark: M['silent-dark'] },
  { key: 'amber', light: M.amber, dark: M['amber-dark'] },
]

// Dark-only "special" themes — menu-only; the toggle pairs them with light.
const SPECIAL_THEMES: ThemeMeta[] = [
  { id: 'amoled', bg: '#000000', accent: '#5AB4A0', reward: '#E09A64' },
  { id: 'cyberpunk', bg: '#0A0820', accent: '#2F6BFF', reward: '#9D3DFF' },
]

const A11Y_THEMES: ThemeMeta[] = [
  { id: 'high-contrast', bg: '#FFFFFF', accent: '#0B5FD4', reward: '#B85000', border: '#000' },
  { id: 'high-contrast-dark', bg: '#000000', accent: '#6DB1FF', reward: '#FF9D4D' },
]

function selectTheme(id: string) {
  if (isLocked(id)) return
  updateProfile({ theme: id as ThemeId })
}

const {
  isSupported: notifSupported,
  isBlocked: notifBlocked,
  isSubscribed,
  isRequesting,
  requestAndSubscribe,
  unsubscribe,
} = useNotifications()

const notifMorning = computed(() => profile.value?.notifMorning ?? true)
const notifEvening = computed(() => profile.value?.notifEvening ?? true)

function toggleNotif(key: 'notifMorning' | 'notifEvening') {
  const current = key === 'notifMorning' ? notifMorning.value : notifEvening.value
  updateProfile({ [key]: !current })
}
</script>

<template>
  <div class="surface-app pb-nav min-h-full">
    <div class="mx-auto max-w-xl px-5 pt-8 pb-6 md:max-w-2xl">
      <!-- Header -->
      <h1 class="font-display text-ink text-3xl leading-tight font-extrabold">
        {{ t('profile.title') }}
      </h1>
      <p class="font-body text-ink-soft mt-1 text-sm">{{ t('profile.subtitle') }}</p>

      <!-- Settings card: name + language -->
      <div class="surface-card mt-5 rounded-2xl p-5 shadow-md" data-test="settings-section">
        <div class="mb-4 flex items-center gap-3">
          <div
            class="bg-sage-tint text-sage-deep flex h-10 w-10 items-center justify-center rounded-[11px]"
          >
            <AppIcon name="settings" :size="20" />
          </div>
          <div>
            <div class="text-ink text-sm font-bold">{{ t('profile.settings.label') }}</div>
            <div class="text-ink-soft text-xs">{{ t('profile.settings.sub') }}</div>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <!-- Name -->
          <label class="flex flex-col gap-1.5">
            <span class="text-ink text-xs font-semibold">{{ t('profile.settings.name') }}</span>
            <input
              data-test="settings-name"
              type="text"
              maxlength="100"
              :placeholder="t('profile.settings.namePlaceholder')"
              class="border-line surface-app text-ink rounded-xl border px-3 py-2.5 text-sm"
              :value="profile?.name ?? ''"
              @change="(e) => updateProfile({ name: (e.target as HTMLInputElement).value })"
            />
          </label>

          <!-- Language -->
          <label class="flex flex-col gap-1.5">
            <span class="text-ink text-xs font-semibold">{{ t('profile.settings.language') }}</span>
            <select
              data-test="settings-language"
              class="border-line surface-app text-ink rounded-xl border px-3 py-2.5 text-sm"
              :value="profile?.language ?? 'ru'"
              @change="(e) => updateProfile({ language: (e.target as HTMLSelectElement).value })"
            >
              <option value="ru">{{ t('profile.settings.languages.ru') }}</option>
              <option value="en">{{ t('profile.settings.languages.en') }}</option>
            </select>
          </label>

          <!-- Timezone -->
          <label class="flex flex-col gap-1.5">
            <span class="text-ink text-xs font-semibold">{{ t('profile.settings.timezone') }}</span>
            <select
              data-test="settings-timezone"
              class="border-line surface-app text-ink rounded-xl border px-3 py-2.5 text-sm"
              :value="currentTz"
              @change="(e) => updateProfile({ timezone: (e.target as HTMLSelectElement).value })"
            >
              <option v-for="tz in timezoneOptions" :key="tz.id" :value="tz.id">
                {{ tz.label }}
              </option>
            </select>
          </label>
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

        <!-- Light/dark pairs — two-column grid keeps it compact -->
        <div class="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
          <div v-for="g in THEME_GROUPS" :key="g.key">
            <p class="text-ink-soft mb-2 truncate text-xs font-semibold">
              {{ t(`profile.theme.groups.${g.key}`) }}
            </p>
            <div class="flex gap-x-2">
              <ThemeSwatch
                v-bind="g.light"
                :label="t('profile.theme.variantLight')"
                :active="profile?.theme === g.light.id"
                :locked="isLocked(g.light.id)"
                :locked-level="themeUnlockLevel(g.light.id)"
                :lock-first-task="isGiftLock(g.light.id)"
                @select="selectTheme"
              />
              <ThemeSwatch
                v-bind="g.dark"
                :label="t('profile.theme.variantDark')"
                :active="profile?.theme === g.dark.id"
                :locked="isLocked(g.dark.id)"
                :locked-level="themeUnlockLevel(g.dark.id)"
                :lock-first-task="isGiftLock(g.dark.id)"
                @select="selectTheme"
              />
            </div>
          </div>

          <!-- Special dark-only themes -->
          <div>
            <p class="text-ink-soft mb-2 truncate text-xs font-semibold">
              {{ t('profile.theme.specialLabel') }}
            </p>
            <div class="flex gap-x-2">
              <ThemeSwatch
                v-for="th in SPECIAL_THEMES"
                :key="th.id"
                v-bind="th"
                :active="profile?.theme === th.id"
                :locked="isLocked(th.id)"
                :locked-level="themeUnlockLevel(th.id)"
                @select="selectTheme"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- A11y section -->
      <p class="font-body text-ink-soft mt-5 mb-3 text-xs font-semibold tracking-widest uppercase">
        {{ t('profile.theme.a11yLabel') }}
      </p>
      <div class="surface-card rounded-2xl p-5 shadow-md">
        <div class="flex gap-x-2">
          <!-- high-contrast is always available; high-contrast-dark is a first-task gift. -->
          <ThemeSwatch
            v-for="(th, i) in A11Y_THEMES"
            :key="th.id"
            v-bind="th"
            :label="i === 0 ? t('profile.theme.variantLight') : t('profile.theme.variantDark')"
            :active="profile?.theme === th.id"
            :locked="isLocked(th.id)"
            :locked-level="themeUnlockLevel(th.id)"
            :lock-first-task="isGiftLock(th.id)"
            @select="selectTheme"
          />
        </div>
      </div>

      <!-- Notifications card -->
      <div class="surface-card mt-5 rounded-2xl p-5 shadow-md" data-test="notifications-section">
        <div class="mb-4 flex items-center gap-3">
          <div
            class="bg-sage-tint text-sage-deep flex h-10 w-10 items-center justify-center rounded-[11px]"
          >
            <AppIcon name="bell" :size="20" />
          </div>
          <div>
            <div class="text-ink text-sm font-bold">{{ t('profile.notifications.label') }}</div>
            <div class="text-ink-soft text-xs">{{ t('profile.notifications.sub') }}</div>
          </div>
        </div>

        <!-- Unsupported -->
        <p v-if="!notifSupported" class="text-ink-soft text-xs">
          {{ t('profile.notifications.unsupported') }}
        </p>

        <!-- Permission blocked -->
        <p v-else-if="notifBlocked" class="text-ink-soft text-xs">
          {{ t('profile.notifications.permissionBlocked') }}
        </p>

        <template v-else>
          <!-- Enable push button -->
          <button
            v-if="!isSubscribed"
            type="button"
            data-test="notif-enable-btn"
            class="bg-sage mb-4 w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
            :disabled="isRequesting"
            @click="requestAndSubscribe"
          >
            {{
              isRequesting
                ? t('profile.notifications.requesting')
                : t('profile.notifications.enableCta')
            }}
          </button>

          <template v-if="isSubscribed">
            <!-- Morning toggle -->
            <label
              class="flex cursor-pointer items-center justify-between gap-4 py-2"
              data-test="notif-morning"
            >
              <div>
                <div class="text-ink text-sm font-semibold">
                  {{ t('profile.notifications.morning') }}
                </div>
                <div class="text-ink-soft text-xs">
                  {{ t('profile.notifications.morningHint') }}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="notifMorning"
                class="relative h-7 w-12 cursor-pointer rounded-full transition-colors"
                :class="notifMorning ? 'bg-sage' : 'bg-line'"
                @click="toggleNotif('notifMorning')"
              >
                <span
                  class="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                  :class="notifMorning ? 'left-6' : 'left-1'"
                />
              </button>
            </label>

            <!-- Evening toggle -->
            <label
              class="flex cursor-pointer items-center justify-between gap-4 py-2"
              data-test="notif-evening"
            >
              <div>
                <div class="text-ink text-sm font-semibold">
                  {{ t('profile.notifications.evening') }}
                </div>
                <div class="text-ink-soft text-xs">
                  {{ t('profile.notifications.eveningHint') }}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="notifEvening"
                class="relative h-7 w-12 cursor-pointer rounded-full transition-colors"
                :class="notifEvening ? 'bg-sage' : 'bg-line'"
                @click="toggleNotif('notifEvening')"
              >
                <span
                  class="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                  :class="notifEvening ? 'left-6' : 'left-1'"
                />
              </button>
            </label>

            <!-- Disable button -->
            <button
              type="button"
              data-test="notif-disable-btn"
              class="text-ink-soft mt-2 w-full cursor-pointer text-xs underline"
              @click="unsubscribe"
            >
              {{ t('profile.notifications.disableCta') }}
            </button>
          </template>
        </template>
      </div>

      <!-- Voluntary survey (collapsed by default to keep the page short) -->
      <ProfileCollapsible
        icon="sparkles"
        :label="t('profile.survey.label')"
        :sub="t('profile.survey.sub')"
      >
        <ProfileSurvey headless />
      </ProfileCollapsible>

      <!-- Feedback & support (collapsed by default) -->
      <ProfileCollapsible
        icon="heart"
        :label="t('profile.feedback.label')"
        :sub="t('profile.feedback.sub')"
      >
        <ProfileFeedback headless />
      </ProfileCollapsible>

      <!-- Help link -->
      <RouterLink
        to="/help"
        class="border-line text-ink-soft hover:text-ink mt-5 flex items-center gap-3 rounded-2xl border px-5 py-3.5 transition-colors"
      >
        <AppIcon name="sparkles" :size="18" class="text-sage-deep flex-shrink-0" />
        <span class="flex-1 text-sm font-semibold">{{ t('help.title') }}</span>
        <AppIcon name="chevronR" :size="16" class="text-ink-faint" />
      </RouterLink>

      <!-- Sign out -->
      <button
        type="button"
        class="border-line text-softrose hover:bg-softrose-tint mt-3 flex w-full items-center gap-3 rounded-2xl border px-5 py-3.5 transition-colors"
        @click="logout()"
      >
        <AppIcon name="logOut" :size="18" class="flex-shrink-0" />
        <span class="flex-1 text-left text-sm font-semibold">{{ t('auth.logout') }}</span>
      </button>
    </div>
  </div>
</template>
