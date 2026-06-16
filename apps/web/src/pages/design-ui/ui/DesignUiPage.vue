<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AppButton,
  AppInput,
  AppCheckbox,
  AppChip,
  AppBadge,
  AppIcon,
  AppLogoMark,
  AppProgressBar,
  AppProgressRing,
  AppToast,
  AppSheet,
  AppBottomNav,
} from '@/shared/ui'

const { t } = useI18n({ useScope: 'global' })

const themes = [
  { id: '', label: 'Sage' },
  { id: 'light', label: 'Light Glass' },
  { id: 'dark', label: 'Dark Glass' },
  { id: 'forest', label: 'Forest' },
  { id: 'lavender', label: 'Lavender' },
  { id: 'lavender-dark', label: 'Lavender Dark' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'high-contrast', label: 'High Contrast' },
  { id: 'high-contrast-dark', label: 'High Contrast Dark' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'ocean-dark', label: 'Ocean Dark' },
  { id: 'eco', label: 'Eco' },
  { id: 'silent', label: 'Silent' },
  { id: 'silent-dark', label: 'Silent Dark' },
  { id: 'amber', label: 'Amber' },
  { id: 'amber-dark', label: 'Amber Dark' },
  { id: 'amoled', label: 'AMOLED' },
]

const activeTheme = ref('')

const inputVal = ref('')
const inputFilled = ref(t('design.ui.input.filledValue'))
const inputError = ref(t('design.ui.input.errorValue'))
const inputNote = ref('')

const checked = ref([false, true, true, false])
const activeChip = ref(1)
const activeNav = ref('home')

const cats = computed(() => [
  { label: t('design.ui.cat.home'), color: 'var(--cat-sage)' },
  { label: t('design.ui.cat.health'), color: 'var(--cat-blue)' },
  { label: t('design.ui.cat.work'), color: 'var(--cat-apricot)' },
  { label: t('design.ui.cat.self'), color: 'var(--cat-mauve)' },
  { label: t('design.ui.cat.sport'), color: 'var(--cat-gold)' },
])

const navItems = computed(() => [
  { id: 'home', icon: 'home' as const, label: t('design.ui.nav.today') },
  { id: 'tasks', icon: 'layers' as const, label: t('design.ui.nav.tasks') },
  { id: 'rewards', icon: 'award' as const, label: t('design.ui.nav.rewards') },
  { id: 'me', icon: 'sun' as const, label: t('design.ui.nav.me') },
])

const iconNames = [
  'check',
  'plus',
  'x',
  'flame',
  'sparkles',
  'moon',
  'bell',
  'home',
  'layers',
  'heart',
  'chevronR',
  'settings',
  'sun',
  'award',
  'leaf',
  'zap',
  'eye',
  'cloud',
] as const
</script>

<template>
  <div class="surface-app min-h-dvh pb-20" :data-theme="activeTheme || undefined">
    <!-- Page header -->
    <header class="surface-card border-line sticky top-0 z-10 border-b shadow-sm">
      <div class="flex items-center gap-3 px-5 py-3">
        <AppLogoMark :size="28" />
        <div>
          <h1 class="font-display text-ink text-xl leading-tight font-extrabold">
            {{ t('app.name') }}
          </h1>
          <p class="text-ink-soft font-body text-xs">{{ t('design.ui.header.subtitle') }}</p>
        </div>
      </div>
      <!-- Theme bar -->
      <div class="border-line flex scrollbar-none gap-2 overflow-x-auto border-t px-4 py-2">
        <button
          v-for="theme in themes"
          :key="theme.id"
          :data-theme="theme.id || undefined"
          class="font-body flex-shrink-0 cursor-pointer rounded-full border-[1.5px] px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors"
          :class="
            activeTheme === theme.id
              ? 'bg-sage-tint text-sage-deep border-sage'
              : 'bg-cream-deep text-ink-soft border-transparent'
          "
          @click="activeTheme = theme.id"
        >
          {{ theme.label }}
        </button>
      </div>
    </header>

    <!-- Grid -->
    <main class="mx-auto grid max-w-[1040px] grid-cols-1 gap-5 px-5 pt-7 md:grid-cols-2">
      <!-- BUTTONS -->
      <section class="surface-card flex flex-col gap-4 rounded-3xl p-5 shadow-md">
        <h2
          class="text-ink-faint font-body border-line-card border-b pb-3 text-[10px] font-bold tracking-widest uppercase"
        >
          {{ t('design.ui.section.buttons') }}
        </h2>
        <div class="flex flex-wrap items-center gap-2">
          <AppButton variant="primary">{{ t('design.ui.btn.done') }}</AppButton>
          <AppButton variant="secondary">{{ t('design.ui.btn.postpone') }}</AppButton>
          <AppButton variant="ghost">{{ t('design.ui.btn.skip') }}</AppButton>
          <AppButton variant="danger">{{ t('design.ui.btn.delete') }}</AppButton>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <AppButton variant="primary" size="sm">{{ t('design.ui.btn.start') }}</AppButton>
          <AppButton variant="secondary" size="sm">{{ t('design.ui.btn.postpone') }}</AppButton>
          <AppButton variant="ghost" size="sm">{{ t('design.ui.btn.later') }}</AppButton>
          <AppButton variant="danger" size="sm">{{ t('design.ui.btn.remove') }}</AppButton>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <AppButton variant="primary" :disabled="true">{{ t('design.ui.btn.done') }}</AppButton>
          <AppButton variant="secondary" :disabled="true">{{
            t('design.ui.btn.postpone')
          }}</AppButton>
          <AppButton variant="danger" :disabled="true">{{ t('design.ui.btn.delete') }}</AppButton>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <AppButton shape="fab" :aria-label="t('design.ui.btn.addTask')">
            <AppIcon name="plus" :size="24" color="#fff" :stroke-width="2.4" />
          </AppButton>
          <AppButton shape="icon" :aria-label="t('design.ui.btn.notifications')">
            <AppIcon name="bell" :size="18" />
          </AppButton>
          <AppButton shape="icon" :aria-label="t('design.ui.btn.settings')">
            <AppIcon name="settings" :size="18" />
          </AppButton>
          <AppButton shape="icon-round" :aria-label="t('design.ui.btn.theme')">
            <AppIcon name="moon" :size="18" />
          </AppButton>
        </div>
      </section>

      <!-- INPUTS -->
      <section class="surface-card flex flex-col gap-4 rounded-3xl p-5 shadow-md">
        <h2
          class="text-ink-faint font-body border-line-card border-b pb-3 text-[10px] font-bold tracking-widest uppercase"
        >
          {{ t('design.ui.section.inputs') }}
        </h2>
        <AppInput
          v-model="inputVal"
          :label="t('design.ui.input.titleLabel')"
          :placeholder="t('design.ui.input.titlePlaceholder')"
          :hint="t('design.ui.input.titleHint')"
        />
        <AppInput v-model="inputFilled" :label="t('design.ui.input.filledLabel')" />
        <AppInput
          v-model="inputError"
          :label="t('design.ui.input.errorLabel')"
          :error="t('design.ui.input.errorMsg')"
        />
        <AppInput
          v-model="inputNote"
          :label="t('design.ui.input.noteLabel')"
          multiline
          :rows="3"
          :placeholder="t('design.ui.input.notePlaceholder')"
        />
      </section>

      <!-- CHECKBOXES -->
      <section class="surface-card flex flex-col gap-4 rounded-3xl p-5 shadow-md">
        <h2
          class="text-ink-faint font-body border-line-card border-b pb-3 text-[10px] font-bold tracking-widest uppercase"
        >
          {{ t('design.ui.section.checkboxes') }}
        </h2>
        <div class="flex flex-wrap items-center gap-4">
          <AppCheckbox v-model="checked[0]" :label="t('design.ui.checkbox.empty')" />
          <AppCheckbox v-model="checked[1]" :label="t('design.ui.checkbox.done')" />
          <AppCheckbox
            v-model="checked[2]"
            :reward="true"
            :label="t('design.ui.checkbox.reward')"
          />
          <AppCheckbox v-model="checked[3]" :size="38" :label="t('design.ui.checkbox.large')" />
        </div>
      </section>

      <!-- CHIPS & BADGES -->
      <section class="surface-card flex flex-col gap-4 rounded-3xl p-5 shadow-md">
        <h2
          class="text-ink-faint font-body border-line-card border-b pb-3 text-[10px] font-bold tracking-widest uppercase"
        >
          {{ t('design.ui.section.chips') }}
        </h2>
        <div class="flex flex-wrap gap-2">
          <AppChip
            v-for="(cat, i) in cats"
            :key="cat.label"
            :label="cat.label"
            :active="activeChip === i"
            :dot-color="cat.color"
            @click="activeChip = i"
          />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <AppBadge variant="streak">
            <template #icon><AppIcon name="flame" :size="13" /></template>
            {{ t('design.ui.badge.streak') }}
          </AppBadge>
          <AppBadge variant="done">
            <template #icon><AppIcon name="check" :size="12" /></template>
            {{ t('design.ui.badge.done') }}
          </AppBadge>
          <AppBadge variant="gentle">{{ t('design.ui.badge.gentle') }}</AppBadge>
          <AppBadge variant="softrose">{{ t('design.ui.badge.softrose') }}</AppBadge>
        </div>
      </section>

      <!-- PROGRESS -->
      <section class="surface-card flex flex-col gap-4 rounded-3xl p-5 shadow-md">
        <h2
          class="text-ink-faint font-body border-line-card border-b pb-3 text-[10px] font-bold tracking-widest uppercase"
        >
          {{ t('design.ui.section.progress') }}
        </h2>
        <div class="flex flex-wrap items-end gap-4">
          <AppProgressRing
            v-for="[d, total] in [
              [0, 6],
              [2, 6],
              [4, 6],
              [6, 6],
            ]"
            :key="d"
            :done="d"
            :total="total"
          />
        </div>
        <div class="mt-2 flex flex-col gap-3">
          <div v-for="p in [15, 40, 65, 85, 100]" :key="p" class="flex items-center gap-3">
            <AppProgressBar :value="p" class="flex-1" />
            <span class="text-ink-faint font-body w-8 text-right text-xs font-bold">{{ p }}%</span>
          </div>
          <AppProgressBar :value="80" :reward="true" />
        </div>
      </section>

      <!-- ICONS -->
      <section class="surface-card flex flex-col gap-4 rounded-3xl p-5 shadow-md">
        <h2
          class="text-ink-faint font-body border-line-card border-b pb-3 text-[10px] font-bold tracking-widest uppercase"
        >
          {{ t('design.ui.section.icons') }}
        </h2>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="n in iconNames"
            :key="n"
            class="bg-sage-tint text-sage-deep flex h-12 w-12 items-center justify-center rounded-xl"
          >
            <AppIcon :name="n" :size="20" />
          </div>
        </div>
        <div class="mt-2 flex items-center gap-3">
          <AppLogoMark :size="28" />
          <AppLogoMark :size="40" />
          <div class="fill-accent flex h-12 w-12 items-center justify-center rounded-xl">
            <AppLogoMark :size="32" :light="true" />
          </div>
        </div>
      </section>

      <!-- TOASTS -->
      <section class="surface-card flex flex-col gap-4 rounded-3xl p-5 shadow-md">
        <h2
          class="text-ink-faint font-body border-line-card border-b pb-3 text-[10px] font-bold tracking-widest uppercase"
        >
          {{ t('design.ui.section.toasts') }}
        </h2>
        <div class="flex flex-col gap-3">
          <AppToast>
            <template #icon>
              <AppIcon name="sparkles" :size="16" color="var(--apricot)" />
            </template>
            {{ t('design.ui.toast.win') }}
          </AppToast>
          <AppToast variant="sage">
            <template #icon
              ><AppIcon name="check" :size="16" color="#fff" :stroke-width="2.5"
            /></template>
            {{ t('design.ui.toast.taskDone') }}
          </AppToast>
          <AppToast variant="gentle">
            <template #icon><AppIcon name="bell" :size="15" /></template>
            {{ t('design.ui.toast.deadline') }}
          </AppToast>
        </div>
      </section>

      <!-- SHEET + NAV -->
      <section class="surface-card flex flex-col gap-4 rounded-3xl p-5 shadow-md">
        <h2
          class="text-ink-faint font-body border-line-card border-b pb-3 text-[10px] font-bold tracking-widest uppercase"
        >
          {{ t('design.ui.section.sheetNav') }}
        </h2>
        <AppSheet :title="t('design.ui.sheet.title')" :subtitle="t('design.ui.sheet.subtitle')">
          <AppInput
            v-model="inputVal"
            :placeholder="t('design.ui.input.sheetPlaceholder')"
            class="mb-3"
          />
          <div class="mb-3 flex flex-wrap gap-2">
            <AppChip
              v-for="(cat, i) in cats.slice(0, 3)"
              :key="cat.label"
              :label="cat.label"
              :active="activeChip === i"
              :dot-color="cat.color"
              @click="activeChip = i"
            />
          </div>
          <AppButton variant="primary" class="w-full justify-center">
            <AppIcon name="plus" :size="17" color="#fff" />
            {{ t('design.ui.btn.addToList') }}
          </AppButton>
        </AppSheet>
        <AppBottomNav v-model="activeNav" :items="navItems" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
