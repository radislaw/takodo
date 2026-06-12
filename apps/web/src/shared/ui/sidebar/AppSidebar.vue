<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '../icon/AppIcon.vue'
import AppLogoMark from '../logo-mark/AppLogoMark.vue'
import StreakFlame from '../streak-flame/StreakFlame.vue'
import type { IconName } from '../icon/icons'

const { t } = useI18n({ useScope: 'global' })
const model = defineModel<string>({ required: true })

withDefaults(
  defineProps<{
    items: { id: string; icon: IconName; label: string }[]
    footerItem?: { id: string; icon: IconName; label: string }
    streak?: number
    shields?: number
    shieldUsedRecently?: boolean
  }>(),
  {
    footerItem: undefined,
    streak: 0,
    shields: 0,
    shieldUsedRecently: false,
  },
)
</script>

<template>
  <nav
    :aria-label="t('a11y.mainNav')"
    class="surface-card border-line flex h-full w-[220px] flex-shrink-0 flex-col border-r px-3 pt-5 pb-4"
  >
    <div class="flex items-center gap-2.5 px-2.5 pb-6">
      <AppLogoMark :size="26" />
      <span class="font-display text-ink text-[17px] font-extrabold">
        {{ t('app.namePart1') }}<span class="text-sage-deep">{{ t('app.namePart2') }}</span>
      </span>
    </div>

    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      :aria-current="model === item.id ? 'page' : undefined"
      :class="[
        'font-body mb-0.5 flex w-full cursor-pointer items-center gap-2.5 rounded-[11px] border-none px-3 py-2.5 text-left text-sm',
        model === item.id
          ? 'bg-sage-tint text-sage-deep font-bold'
          : 'text-ink-soft bg-transparent font-semibold',
      ]"
      @click="model = item.id"
    >
      <AppIcon :name="item.icon" :size="17" :stroke-width="model === item.id ? 2.4 : 2" />
      <span>{{ item.label }}</span>
    </button>

    <div class="flex-1" />

    <StreakFlame
      v-if="streak > 0"
      class="mx-1 mb-2.5"
      :streak="streak"
      :shields="shields"
      :shield-used-recently="shieldUsedRecently"
    />

    <button
      v-if="footerItem"
      type="button"
      :aria-current="model === footerItem.id ? 'page' : undefined"
      :class="[
        'font-body flex w-full cursor-pointer items-center gap-2.5 rounded-[11px] border-none px-3 py-2.5 text-left text-sm',
        model === footerItem.id
          ? 'bg-sage-tint text-sage-deep font-bold'
          : 'text-ink-soft bg-transparent font-semibold',
      ]"
      @click="model = footerItem.id"
    >
      <AppIcon
        :name="footerItem.icon"
        :size="17"
        :stroke-width="model === footerItem.id ? 2.4 : 2"
      />
      <span>{{ footerItem.label }}</span>
    </button>
  </nav>
</template>
