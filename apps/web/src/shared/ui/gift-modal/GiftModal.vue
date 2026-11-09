<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fireConfetti, fireFireworks } from '@/shared/lib/confetti'
import type { CelebrationEvent } from '@/shared/lib/useProgressCelebration'

const props = defineProps<{ event: CelebrationEvent | null }>()
const emit = defineEmits<{ dismiss: [] }>()

const { t, tm, rt } = useI18n({ useScope: 'global' })

const motivationIndex = ref(0)

function getList(key: string): string[] {
  const raw = tm(key)
  if (!raw) return []
  return Object.values(raw as object).map((v) => rt(v as Parameters<typeof rt>[0]))
}

function isReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

const isFirstTask = computed(() => props.event?.kind === 'first-task')
const hasTheme = computed(() => (props.event?.themes.length ?? 0) > 0)

const emoji = computed(() => {
  if (isFirstTask.value) return '🌙'
  return hasTheme.value ? '🎁' : '✨'
})

const title = computed(() => {
  if (!props.event) return ''
  if (isFirstTask.value) return t('gift.firstTask.title')
  return t('gift.levelUp.title', { n: props.event.level })
})

// The light theme leads the pair — name the group by its first (light) variant.
const themeName = computed(() => {
  const first = props.event?.themes[0]
  return first ? t(`profile.themes.${first}`) : ''
})

const body = computed(() => {
  if (!props.event) return ''
  if (isFirstTask.value) return t('gift.firstTask.body')
  if (hasTheme.value) return t('gift.levelUp.themeUnlocked', { name: themeName.value })
  return getList('gift.motivation')[motivationIndex.value] ?? ''
})

const nextGiftText = computed(() => {
  if (!props.event) return ''
  if (props.event.nextGift === null) return t('gift.levelUp.maxed')
  return t('gift.levelUp.nextGift', { n: props.event.nextGift - props.event.level })
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('dismiss')
}

watch(
  () => props.event,
  (event) => {
    if (!event) {
      document.removeEventListener('keydown', onKeydown)
      return
    }
    const motivations = getList('gift.motivation')
    motivationIndex.value = Math.floor(Math.random() * Math.max(1, motivations.length))
    if (!isReducedMotion()) {
      fireConfetti()
      fireFireworks()
      if (event.kind === 'first-task') fireFireworks()
    }
    document.addEventListener('keydown', onKeydown)
  },
  { immediate: true },
)

onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="gift-fade">
      <div
        v-if="event"
        class="fixed inset-0 z-[55] flex items-center justify-center px-6"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="bg-ink/40 absolute inset-0" @click="emit('dismiss')" />
        <div class="surface-card relative w-full max-w-xs rounded-3xl p-7 text-center shadow-xl">
          <span class="gift-emoji" aria-hidden="true">{{ emoji }}</span>
          <h2 class="font-display text-ink mt-3 text-2xl font-extrabold">{{ title }}</h2>
          <p class="font-body text-ink-soft mt-2 text-sm leading-snug">{{ body }}</p>
          <p
            v-if="!isFirstTask || event.nextGift !== null"
            class="text-ink-faint mt-3 text-xs font-semibold"
          >
            {{ nextGiftText }}
          </p>
          <button
            type="button"
            data-test="gift-cta"
            class="bg-sage mt-5 w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-white"
            @click="emit('dismiss')"
          >
            {{ t('gift.cta') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.gift-emoji {
  display: inline-block;
  font-size: 3rem;
  line-height: 1;
  animation: gift-pop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes gift-pop {
  from {
    opacity: 0;
    transform: scale(0.6) rotate(-8deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

.gift-fade-enter-active {
  transition: opacity 0.18s ease;
}
.gift-fade-leave-active {
  transition: opacity 0.4s ease;
}
.gift-fade-enter-from,
.gift-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .gift-emoji {
    animation: none;
  }
}
</style>
