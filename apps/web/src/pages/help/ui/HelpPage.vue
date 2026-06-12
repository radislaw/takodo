<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/ui'

const { t, tm, rt } = useI18n({ useScope: 'global' })
const router = useRouter()

const SECTIONS = [
  { key: 'today', icon: 'home' },
  { key: 'do', icon: 'zap' },
  { key: 'tasks', icon: 'layers' },
  { key: 'frequent', icon: 'repeat' },
  { key: 'quests', icon: 'sparkles' },
  { key: 'rewards', icon: 'flame' },
  { key: 'levels', icon: 'award' },
  { key: 'settings', icon: 'settings' },
  { key: 'philosophy', icon: 'heart' },
  { key: 'icons', icon: 'zap' },
  { key: 'faq', icon: 'more' },
] as const

const openSection = ref<string | null>(null)

function toggle(key: string) {
  openSection.value = openSection.value === key ? null : key
}

function tips(key: string): string[] {
  return (tm(`help.sections.${key}.tips`) as unknown[]).map((item) =>
    rt(item as Parameters<typeof rt>[0]),
  )
}
</script>

<template>
  <div class="surface-app pb-nav min-h-full">
    <header class="surface-card border-line sticky top-0 z-10 border-b shadow-sm">
      <div class="flex items-center gap-3 px-5 py-4">
        <button
          type="button"
          class="text-ink-soft hover:text-ink -ml-1 flex h-9 w-9 cursor-pointer items-center justify-center"
          @click="router.back()"
        >
          <AppIcon name="chevronR" :size="22" style="transform: rotate(180deg)" />
        </button>
        <h1 class="font-display text-ink text-xl leading-tight font-extrabold">
          {{ t('help.title') }}
        </h1>
      </div>
    </header>

    <main class="mx-auto max-w-xl px-4 pt-4 pb-6">
      <p class="font-body text-ink-soft mb-5 text-sm">{{ t('help.subtitle') }}</p>

      <div class="flex flex-col gap-2">
        <div
          v-for="section in SECTIONS"
          :key="section.key"
          class="surface-card overflow-hidden rounded-2xl shadow-sm"
        >
          <button
            type="button"
            class="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left"
            @click="toggle(section.key)"
          >
            <div
              class="bg-sage-tint text-sage-deep flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
            >
              <AppIcon :name="section.icon as any" :size="18" />
            </div>
            <span class="text-ink flex-1 text-sm font-bold">
              {{ t(`help.sections.${section.key}.title`) }}
            </span>
            <AppIcon
              name="chevronR"
              :size="16"
              class="text-ink-soft flex-shrink-0 transition-transform duration-200"
              :style="
                openSection === section.key
                  ? 'transform: rotate(90deg)'
                  : 'transform: rotate(-90deg)'
              "
            />
          </button>

          <Transition name="accordion">
            <div v-if="openSection === section.key">
              <ul class="border-line border-t px-4 pt-3 pb-4">
                <li
                  v-for="(tip, i) in tips(section.key)"
                  :key="i"
                  class="font-body text-ink-soft flex gap-2.5 text-sm leading-relaxed"
                  :class="i > 0 ? 'mt-2.5' : ''"
                >
                  <span class="text-sage-deep mt-0.5 flex-shrink-0 font-bold">{{
                    t('rewards.shieldUsedSep')
                  }}</span>
                  <span>{{ tip }}</span>
                </li>
              </ul>
            </div>
          </Transition>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition:
    max-height 0.25s ease,
    opacity 0.2s ease;
  max-height: 500px;
  overflow: hidden;
}
.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .accordion-enter-active,
  .accordion-leave-active {
    transition: none;
  }
}
</style>
