<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, ActivityHeatmap, AppStatCard, SoftNote, LevelRing } from '@/shared/ui'
import type { IconName } from '@/shared/ui'
import { useRewards, useHeatmap } from '@/shared/api'

const BADGE_ICONS: Record<string, string> = {
  first_step: 'sparkles',
  streak_5: 'flame',
  streak_7: 'award',
  streak_21: 'trophy',
  gentle_mode: 'moon',
}

const { t } = useI18n({ useScope: 'global' })
const { data: rewards, isPending } = useRewards()
const { data: heatmap } = useHeatmap()

const weekdayLabel = computed(() => {
  if (!rewards.value) return []
  return rewards.value.week.map((day) => {
    const d = new Date(day.date + 'T00:00:00Z')
    return t(`rewards.weekdays.${d.getUTCDay()}`)
  })
})

interface Stat {
  key: string
  label: string
  value: string | number
  icon: IconName
}

// Aggregates over the heatmap window (~1 year); summary numbers come from rewards.
const stats = computed<Stat[]>(() => {
  if (!rewards.value) return []
  const days = heatmap.value?.days ?? []
  const totalDone = days.reduce((sum, d) => sum + d.count, 0)
  const activeDays = days.filter((d) => d.count > 0).length
  const bestDay = heatmap.value?.max ?? 0
  return [
    { key: 'streak', label: t('rewards.stats.streak'), value: rewards.value.streak, icon: 'flame' },
    {
      key: 'longest',
      label: t('rewards.stats.longest'),
      value: rewards.value.longestStreak,
      icon: 'trophy',
    },
    { key: 'level', label: t('rewards.stats.level'), value: rewards.value.level, icon: 'award' },
    { key: 'xp', label: t('rewards.stats.xp'), value: rewards.value.xp, icon: 'sparkles' },
    { key: 'done', label: t('rewards.stats.done'), value: totalDone, icon: 'check' },
    { key: 'active', label: t('rewards.stats.active'), value: activeDays, icon: 'layers' },
    { key: 'best', label: t('rewards.stats.best'), value: bestDay, icon: 'zap' },
    {
      key: 'shields',
      label: t('rewards.stats.shields'),
      value: rewards.value.shields,
      icon: 'shield',
    },
  ]
})
</script>

<template>
  <div class="surface-app pb-nav min-h-full">
    <div class="mx-auto max-w-xl px-5 pt-8 pb-6 md:max-w-3xl lg:max-w-5xl lg:px-8">
      <!-- Header -->
      <h1 class="font-display text-ink text-3xl leading-tight font-extrabold">
        {{ t('rewards.title') }}
      </h1>
      <p class="font-body text-ink-soft mt-1 text-sm">{{ t('rewards.subtitle') }}</p>

      <div v-if="isPending" class="text-ink-soft font-body py-12 text-center text-sm">
        {{ t('today.loading') }}
      </div>

      <div
        v-else-if="rewards"
        class="lg:grid lg:grid-cols-[1fr_260px] lg:items-start lg:gap-[22px]"
      >
        <!-- Right rail (desktop): streak hero + gentle note -->
        <aside class="lg:sticky lg:top-8 lg:col-start-2 lg:row-start-1">
          <!-- Streak hero -->
          <div class="bg-apricot-tint mt-5 rounded-2xl p-5 shadow-md lg:mt-0">
            <div class="flex items-center gap-4">
              <div
                class="bg-apricot flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full shadow-lg"
              >
                <AppIcon name="flame" :size="28" color="#fff" />
              </div>
              <div>
                <div class="font-display text-apricot-deep text-2xl font-extrabold">
                  {{ t('rewards.streakHero', rewards.streak) }}
                </div>
                <div class="text-apricot-deep mt-0.5 text-sm font-semibold opacity-80">
                  {{ t('rewards.streakSub') }}
                </div>
              </div>
            </div>

            <!-- Weekly dots -->
            <div class="mt-5 flex justify-between">
              <div
                v-for="(day, i) in rewards.week"
                :key="day.date"
                class="flex flex-col items-center gap-1.5"
              >
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full"
                  :class="
                    day.active ? 'bg-apricot' : day.shielded ? 'bg-apricot/40' : 'bg-apricot/20'
                  "
                >
                  <AppIcon
                    v-if="day.active"
                    name="check"
                    :size="16"
                    color="#fff"
                    :stroke-width="3"
                  />
                  <AppIcon
                    v-else-if="day.shielded"
                    name="shield"
                    :size="14"
                    class="text-apricot-deep opacity-70"
                  />
                </div>
                <span class="text-apricot-deep text-[11px] font-bold opacity-75">
                  {{ weekdayLabel[i] }}
                </span>
              </div>
            </div>

            <!-- Shields row -->
            <div
              v-if="rewards.shields > 0 || rewards.shieldUsedRecently"
              class="mt-4 flex items-center gap-2"
            >
              <div class="flex gap-1">
                <AppIcon
                  v-for="i in rewards.shields"
                  :key="i"
                  name="shield"
                  :size="16"
                  class="text-apricot-deep"
                />
                <AppIcon
                  v-for="i in 2 - rewards.shields"
                  :key="'empty-' + i"
                  name="shield"
                  :size="16"
                  class="text-apricot/30"
                />
              </div>
              <span class="text-apricot-deep text-xs font-semibold opacity-80">
                {{ t('rewards.shieldsLabel') }}
              </span>
              <span v-if="rewards.shieldUsedRecently" class="text-apricot-deep text-xs opacity-60">
                {{ t('rewards.shieldUsedSep') }} {{ t('rewards.shieldUsed') }}
              </span>
            </div>
          </div>

          <!-- Gentle note (desktop rail) -->
          <SoftNote class="mt-4 hidden lg:flex">{{ t('rewards.gentleNote') }}</SoftNote>
        </aside>

        <!-- Main column: level + stats + heatmap + badges -->
        <div class="lg:col-start-1 lg:row-start-1">
          <!-- Level card -->
          <div class="surface-card mt-5 flex items-center gap-5 rounded-2xl p-5 shadow-md lg:mt-0">
            <LevelRing :level="rewards.level" :xp="rewards.xp" />
            <div>
              <div class="text-ink text-sm font-bold">
                {{ t('profile.levelRing.label') }} {{ rewards.level }}
              </div>
              <div class="text-ink-soft text-xs">
                {{ t('profile.levelRing.xp', { xp: rewards.xp }) }}
              </div>
            </div>
          </div>

          <!-- Stats grid -->
          <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AppStatCard
              v-for="stat in stats"
              :key="stat.key"
              :label="stat.label"
              :value="stat.value"
              :icon="stat.icon"
            />
          </div>

          <!-- Activity heatmap -->
          <div v-if="heatmap" class="surface-card mt-5 rounded-2xl p-5 shadow-sm">
            <p class="font-display text-ink mb-4 text-sm font-extrabold">
              {{ t('rewards.heatmap.title') }}
            </p>
            <ActivityHeatmap :days="heatmap.days" :max="heatmap.max" />
          </div>

          <!-- Badges -->
          <p
            class="font-body text-ink-soft mt-6 mb-3 text-xs font-semibold tracking-widest uppercase"
          >
            {{ t('rewards.badgesLabel') }}
          </p>
          <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div
              v-for="badge in rewards.badges"
              :key="badge.id"
              class="surface-card rounded-2xl p-4 shadow-sm"
              :class="{ 'opacity-50': !badge.earned }"
            >
              <div
                class="flex h-11 w-11 items-center justify-center rounded-full"
                :class="
                  badge.earned ? 'bg-sage-tint text-sage-deep' : 'bg-cream-deep text-ink-faint'
                "
              >
                <AppIcon :name="(BADGE_ICONS[badge.id] ?? 'sparkles') as any" :size="22" />
              </div>
              <div class="font-display text-ink mt-3 text-sm font-extrabold">
                {{ t(`rewards.badges.${badge.id}.title`) }}
              </div>
              <div class="text-ink-soft mt-0.5 text-xs leading-snug">
                <template v-if="!badge.earned && badge.remaining !== undefined">
                  {{
                    t(`rewards.badges.${badge.id}.sub_remaining`, { remaining: badge.remaining })
                  }}
                </template>
                <template v-else>
                  {{ t(`rewards.badges.${badge.id}.sub`) }}
                </template>
              </div>
            </div>
          </div>

          <!-- Gentle note (mobile/tablet) -->
          <SoftNote class="mt-5 lg:hidden">{{ t('rewards.gentleNote') }}</SoftNote>
        </div>
      </div>
    </div>
  </div>
</template>
