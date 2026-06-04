<script setup lang="ts">
import { ref } from 'vue'
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

const themes = [
  { id: '', label: 'Sage' },
  { id: 'dark', label: 'Dark' },
  { id: 'lavender', label: 'Lavender' },
  { id: 'lavender-dark', label: 'Lavender Dark' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'high-contrast', label: 'High Contrast' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'eco', label: 'Eco' },
  { id: 'silent', label: 'Silent' },
  { id: 'amber', label: 'Amber' },
  { id: 'amoled', label: 'AMOLED' },
]

const activeTheme = ref('')

const inputVal = ref('')
const inputFilled = ref('Позвонить маме вечером')
const inputError = ref('текст задачи слишком длинный')
const inputNote = ref('')

const checked = ref([false, true, true, false])
const activeChip = ref(1)
const activeNav = ref('home')

const cats = [
  { label: 'Дом', color: 'var(--cat-sage)' },
  { label: 'Здоровье', color: 'var(--cat-blue)' },
  { label: 'Работа', color: 'var(--cat-apricot)' },
  { label: 'Себе', color: 'var(--cat-mauve)' },
  { label: 'Спорт', color: 'var(--cat-gold)' },
]

const navItems = [
  { id: 'home', icon: 'home' as const, label: 'Сегодня' },
  { id: 'tasks', icon: 'layers' as const, label: 'Задачи' },
  { id: 'rewards', icon: 'award' as const, label: 'Награды' },
  { id: 'me', icon: 'sun' as const, label: 'Я' },
]

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
          <h1 class="font-display text-ink text-xl leading-tight font-extrabold">TooToo</h1>
          <p class="text-ink-soft font-body text-xs">UI Kit — Phase 0.2</p>
        </div>
      </div>
      <!-- Theme bar -->
      <div class="border-line flex scrollbar-none gap-2 overflow-x-auto border-t px-4 py-2">
        <button
          v-for="t in themes"
          :key="t.id"
          :data-theme="t.id || undefined"
          class="font-body flex-shrink-0 cursor-pointer rounded-full border-[1.5px] px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors"
          :class="
            activeTheme === t.id
              ? 'bg-sage-tint text-sage-deep border-sage'
              : 'bg-cream-deep text-ink-soft border-transparent'
          "
          @click="activeTheme = t.id"
        >
          {{ t.label }}
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
          Кнопки
        </h2>
        <div class="flex flex-wrap items-center gap-2">
          <AppButton variant="primary">Готово</AppButton>
          <AppButton variant="secondary">Отложить</AppButton>
          <AppButton variant="ghost">Пропустить</AppButton>
          <AppButton variant="danger">Удалить</AppButton>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <AppButton variant="primary" size="sm">Начать</AppButton>
          <AppButton variant="secondary" size="sm">Отложить</AppButton>
          <AppButton variant="ghost" size="sm">Позже</AppButton>
          <AppButton variant="danger" size="sm">Убрать</AppButton>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <AppButton variant="primary" :disabled="true">Готово</AppButton>
          <AppButton variant="secondary" :disabled="true">Отложить</AppButton>
          <AppButton variant="danger" :disabled="true">Удалить</AppButton>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <AppButton shape="fab" aria-label="Добавить задачу">
            <AppIcon name="plus" :size="24" color="#fff" :stroke-width="2.4" />
          </AppButton>
          <AppButton shape="icon" aria-label="Уведомления">
            <AppIcon name="bell" :size="18" />
          </AppButton>
          <AppButton shape="icon" aria-label="Настройки">
            <AppIcon name="settings" :size="18" />
          </AppButton>
          <AppButton shape="icon-round" aria-label="Тема">
            <AppIcon name="moon" :size="18" />
          </AppButton>
        </div>
      </section>

      <!-- INPUTS -->
      <section class="surface-card flex flex-col gap-4 rounded-3xl p-5 shadow-md">
        <h2
          class="text-ink-faint font-body border-line-card border-b pb-3 text-[10px] font-bold tracking-widest uppercase"
        >
          Поля ввода
        </h2>
        <AppInput
          v-model="inputVal"
          label="Название дела"
          placeholder="Налить себе воды"
          hint="Опиши одним коротким шагом"
        />
        <AppInput v-model="inputFilled" label="Заполненное" />
        <AppInput
          v-model="inputError"
          label="С ошибкой"
          error="Название слишком длинное — сократи"
        />
        <AppInput
          v-model="inputNote"
          label="Заметка"
          multiline
          :rows="3"
          placeholder="Контекст или напоминание..."
        />
      </section>

      <!-- CHECKBOXES -->
      <section class="surface-card flex flex-col gap-4 rounded-3xl p-5 shadow-md">
        <h2
          class="text-ink-faint font-body border-line-card border-b pb-3 text-[10px] font-bold tracking-widest uppercase"
        >
          Чекбоксы
        </h2>
        <div class="flex flex-wrap items-center gap-4">
          <AppCheckbox v-model="checked[0]" label="Пусто" />
          <AppCheckbox v-model="checked[1]" label="Готово" />
          <AppCheckbox v-model="checked[2]" :reward="true" label="Награда" />
          <AppCheckbox v-model="checked[3]" :size="38" label="Большой" />
        </div>
      </section>

      <!-- CHIPS & BADGES -->
      <section class="surface-card flex flex-col gap-4 rounded-3xl p-5 shadow-md">
        <h2
          class="text-ink-faint font-body border-line-card border-b pb-3 text-[10px] font-bold tracking-widest uppercase"
        >
          Чипы и значки
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
            Серия 7 дн.
          </AppBadge>
          <AppBadge variant="done">
            <template #icon><AppIcon name="check" :size="12" /></template>
            Выполнено
          </AppBadge>
          <AppBadge variant="gentle">Скоро срок</AppBadge>
          <AppBadge variant="softrose">Перенесено</AppBadge>
        </div>
      </section>

      <!-- PROGRESS -->
      <section class="surface-card flex flex-col gap-4 rounded-3xl p-5 shadow-md">
        <h2
          class="text-ink-faint font-body border-line-card border-b pb-3 text-[10px] font-bold tracking-widest uppercase"
        >
          Прогресс
        </h2>
        <div class="flex flex-wrap items-end gap-4">
          <AppProgressRing
            v-for="[d, t] in [
              [0, 6],
              [2, 6],
              [4, 6],
              [6, 6],
            ]"
            :key="d"
            :done="d"
            :total="t"
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
          Иконки + лого
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
          Уведомления
        </h2>
        <div class="flex flex-col gap-3">
          <AppToast>
            <template #icon>
              <AppIcon name="sparkles" :size="16" color="var(--apricot)" />
            </template>
            Маленькая победа засчитана!
          </AppToast>
          <AppToast variant="sage">
            <template #icon
              ><AppIcon name="check" :size="16" color="#fff" :stroke-width="2.5"
            /></template>
            Задача выполнена
          </AppToast>
          <AppToast variant="gentle">
            <template #icon><AppIcon name="bell" :size="15" /></template>
            Скоро срок задачи
          </AppToast>
        </div>
      </section>

      <!-- SHEET + NAV -->
      <section class="surface-card flex flex-col gap-4 rounded-3xl p-5 shadow-md">
        <h2
          class="text-ink-faint font-body border-line-card border-b pb-3 text-[10px] font-bold tracking-widest uppercase"
        >
          Лист и навигация
        </h2>
        <AppSheet title="Новое дело" subtitle="Опиши одним коротким шагом">
          <AppInput v-model="inputVal" placeholder="Например: налить себе воды" class="mb-3" />
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
            Добавить в список
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
