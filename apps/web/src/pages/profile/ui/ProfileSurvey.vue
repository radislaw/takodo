<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/ui'
import { useProfile, useUpdateProfile } from '@/shared/api'

const { t } = useI18n({ useScope: 'global' })
const { data: profile } = useProfile()
const { mutate: updateProfile } = useUpdateProfile()

const GENDERS = ['female', 'male', 'other', 'na'] as const
const ADHD = ['diagnosed', 'suspected', 'no', 'na'] as const

const gender = computed(() => profile.value?.gender ?? '')
const city = computed(() => profile.value?.city ?? '')
const birthYear = computed(() => profile.value?.birthYear ?? '')
const adhdStatus = computed(() => profile.value?.adhdStatus ?? '')

function onGender(e: Event) {
  updateProfile({ gender: (e.target as HTMLSelectElement).value })
}
function onAdhd(e: Event) {
  updateProfile({ adhdStatus: (e.target as HTMLSelectElement).value })
}
function onCity(e: Event) {
  updateProfile({ city: (e.target as HTMLInputElement).value })
}
function onBirthYear(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  if (raw === '') return
  const year = Number(raw)
  if (Number.isInteger(year) && year >= 1900 && year <= 2025) {
    updateProfile({ birthYear: year })
  }
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

      <!-- Birth year -->
      <label class="flex flex-col gap-1.5">
        <span class="text-ink text-xs font-semibold">{{ t('profile.survey.birthYear') }}</span>
        <input
          data-test="survey-birth-year"
          type="number"
          inputmode="numeric"
          min="1900"
          max="2025"
          :placeholder="t('profile.survey.birthYearPlaceholder')"
          class="border-line surface-app text-ink rounded-xl border px-3 py-2.5 text-sm"
          :value="birthYear"
          @change="onBirthYear"
        />
      </label>

      <!-- City -->
      <label class="flex flex-col gap-1.5">
        <span class="text-ink text-xs font-semibold">{{ t('profile.survey.city') }}</span>
        <input
          data-test="survey-city"
          type="text"
          maxlength="100"
          :placeholder="t('profile.survey.cityPlaceholder')"
          class="border-line surface-app text-ink rounded-xl border px-3 py-2.5 text-sm"
          :value="city"
          @change="onCity"
        />
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
  </div>
</template>
