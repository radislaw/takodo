<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fireConfetti, fireFireworks } from '@/shared/lib/confetti'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { tm, rt } = useI18n({ useScope: 'global' })

const praiseIndex = ref(0)
const emojiIndex = ref(0)
let closeTimer: ReturnType<typeof setTimeout> | null = null

function getList(key: string): string[] {
  const raw = tm(key)
  if (!raw) return []
  return Object.values(raw as object).map((v) => rt(v as Parameters<typeof rt>[0]))
}

const praiseText = computed(() => getList('reward.praise')[praiseIndex.value] ?? '')
const emojiText = computed(() => getList('reward.emoji')[emojiIndex.value] ?? '🎉')

function isReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function clearTimer() {
  if (closeTimer !== null) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

watch(
  () => props.show,
  (val) => {
    if (!val) {
      clearTimer()
      return
    }

    const praises = getList('reward.praise')
    const emojis = getList('reward.emoji')
    praiseIndex.value = Math.floor(Math.random() * praises.length)
    emojiIndex.value = Math.floor(Math.random() * emojis.length)

    if (!isReducedMotion()) {
      fireConfetti()
      fireFireworks()
    }

    clearTimer()
    closeTimer = setTimeout(() => {
      emit('close')
    }, 1800)
  },
  { immediate: true },
)

onUnmounted(clearTimer)
</script>

<template>
  <Teleport to="body">
    <Transition name="reward-fade">
      <div
        v-if="show"
        class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
        role="status"
        aria-live="polite"
        :aria-label="$t('reward.aria')"
      >
        <div class="reward-card">
          <span class="reward-emoji" aria-hidden="true">{{ emojiText }}</span>
          <span class="reward-text">{{ praiseText }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.reward-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px 32px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.14),
    0 0 0 2px var(--apricot, #ffab6e),
    0 0 32px rgba(255, 171, 110, 0.35);
  backdrop-filter: blur(6px);
  animation: reward-pop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.reward-emoji {
  font-size: 2rem;
  line-height: 1;
}

.reward-text {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--apricot, #ffab6e);
  text-shadow: 0 0 16px rgba(255, 171, 110, 0.4);
  white-space: nowrap;
}

@keyframes reward-pop {
  from {
    opacity: 0;
    transform: scale(0.75);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.reward-fade-enter-active {
  transition: opacity 0.15s ease;
}
.reward-fade-leave-active {
  transition: opacity 0.5s ease;
}
.reward-fade-enter-from,
.reward-fade-leave-to {
  opacity: 0;
}
</style>
