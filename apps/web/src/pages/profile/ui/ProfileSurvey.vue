<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/ui'
import { useProfile, useUpdateProfile } from '@/shared/api'

const { t } = useI18n({ useScope: 'global' })
const { data: profile } = useProfile()
const { mutate: updateProfile } = useUpdateProfile()

const GENDERS = ['female', 'male'] as const
const ADHD = ['diagnosed', 'suspected', 'no', 'na'] as const

const TIMEZONES = [
  'Europe/Moscow',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'Asia/Magadan',
  'Asia/Kamchatka',
  'Europe/Kaliningrad',
  'Europe/Minsk',
  'Europe/Kiev',
  'Europe/Chisinau',
  'Asia/Tbilisi',
  'Asia/Yerevan',
  'Asia/Baku',
  'Asia/Tashkent',
  'Asia/Almaty',
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Amsterdam',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
]

const gender = computed(() => profile.value?.gender ?? '')
const timezone = computed(() => profile.value?.timezone ?? '')
const birthDate = computed(() => profile.value?.birthDate ?? '')
const adhdStatus = computed(() => profile.value?.adhdStatus ?? '')

function onGender(e: Event) {
  updateProfile({ gender: (e.target as HTMLSelectElement).value })
}
function onAdhd(e: Event) {
  updateProfile({ adhdStatus: (e.target as HTMLSelectElement).value })
}
function onTimezone(e: Event) {
  const val = (e.target as HTMLInputElement).value.trim()
  if (val) updateProfile({ timezone: val })
}
function onBirthDate(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (val) updateProfile({ birthDate: val })
}
</script>

<template>
  <div class="surface-card mt-5 rounded-2xl p-5 shadow-md" data-test="survey-section">
    <div class="mb-4 flex items-center gap-3">
      <div
        class="bg-sage-tint text-sage-deep flex h-10 w-10 items-center justify-center rounded-[11px]"
      >
        <AppIcon name="sparkles" :size="20" />
      </div>
      <div>
        <div class="text-ink text-sm font-bold">{{ t('profile.survey.label') }}</div>
        <div class="text-ink-soft text-xs">{{ t('profile.survey.sub') }}</div>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <!-- Gender -->
      <label class="flex flex-col gap-1.5">
        <span class="text-ink text-xs font-semibold">{{ t('profile.survey.gender') }}</span>
        <select
          data-test="survey-gender"
          class="border-line surface-app text-ink rounded-xl border px-3 py-2.5 text-sm"
          :value="gender"
          @change="onGender"
        >
          <option value="">{{ t('profile.survey.notChosen') }}</option>
          <option v-for="g in GENDERS" :key="g" :value="g">
            {{ t(`profile.survey.genderOptions.${g}`) }}
          </option>
        </select>
      </label>

      <!-- Birth date -->
      <label class="flex flex-col gap-1.5">
        <span class="text-ink text-xs font-semibold">{{ t('profile.survey.birthDate') }}</span>
        <input
          data-test="survey-birth-date"
          type="date"
          min="1900-01-01"
          max="2025-12-31"
          class="border-line surface-app text-ink rounded-xl border px-3 py-2.5 text-sm"
          :value="birthDate"
          @change="onBirthDate"
        />
      </label>

      <!-- Timezone -->
      <label class="flex flex-col gap-1.5">
        <span class="text-ink text-xs font-semibold">{{ t('profile.survey.timezone') }}</span>
        <input
          data-test="survey-timezone"
          type="text"
          list="tz-list"
          maxlength="100"
          :placeholder="t('profile.survey.timezonePlaceholder')"
          class="border-line surface-app text-ink rounded-xl border px-3 py-2.5 text-sm"
          :value="timezone"
          @change="onTimezone"
        />
        <datalist id="tz-list">
          <option v-for="tz in TIMEZONES" :key="tz" :value="tz" />
        </datalist>
      </label>

      <!-- ADHD status -->
      <label class="flex flex-col gap-1.5">
        <span class="text-ink text-xs font-semibold">{{ t('profile.survey.adhd') }}</span>
        <select
          data-test="survey-adhd"
          class="border-line surface-app text-ink rounded-xl border px-3 py-2.5 text-sm"
          :value="adhdStatus"
          @change="onAdhd"
        >
          <option value="">{{ t('profile.survey.notChosen') }}</option>
          <option v-for="a in ADHD" :key="a" :value="a">
            {{ t(`profile.survey.adhdOptions.${a}`) }}
          </option>
        </select>
      </label>
    </div>

    <!-- Privacy notice -->
    <p class="text-ink-faint mt-4 text-xs leading-relaxed">
      {{ t('profile.survey.privacy') }}
    </p>
  </div>
</template>
