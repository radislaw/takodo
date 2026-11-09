<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import AppSheet from '../sheet/AppSheet.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    subtitle?: string
  }>(),
  {
    title: undefined,
    subtitle: undefined,
  },
)

const emit = defineEmits<{ close: [] }>()

function lockScroll() {
  document.body.style.overflow = 'hidden'
}

function unlockScroll() {
  document.body.style.overflow = ''
}

function handleEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      lockScroll()
      document.addEventListener('keydown', handleEsc)
    } else {
      unlockScroll()
      document.removeEventListener('keydown', handleEsc)
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  unlockScroll()
  document.removeEventListener('keydown', handleEsc)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end sm:justify-center"
        role="dialog"
        aria-modal="true"
      >
        <div class="bg-ink/40 absolute inset-0" aria-hidden="true" @click="emit('close')" />
        <div class="relative w-full sm:max-w-md">
          <AppSheet :title="title" :subtitle="subtitle">
            <slot />
          </AppSheet>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-enter-active .sheet-enter-from + *,
.sheet-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.25s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from > :last-child,
.sheet-leave-to > :last-child {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active {
    transition: opacity 0.15s ease;
  }
  .sheet-enter-from > :last-child,
  .sheet-leave-to > :last-child {
    transform: none;
  }
}
</style>
