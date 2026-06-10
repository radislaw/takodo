<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppBottomNav, RewardBurst, AppToast } from '@/shared/ui'
import type { IconName } from '@/shared/ui/icon/icons'
import { useReward } from '@/shared/lib/useReward'
import { useErrorToast } from '@/shared/lib/useErrorToast'
import { useProfile } from '@/shared/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const { isVisible, hide } = useReward()
const { key: errorKey, hideError } = useErrorToast()
const { data: profile } = useProfile()

const theme = computed(() => profile.value?.theme ?? 'amoled')

const navItems = computed<{ id: string; icon: IconName; label: string }[]>(() => [
  { id: 'today', icon: 'home', label: t('nav.today') },
  { id: 'tasks', icon: 'layers', label: t('nav.tasks') },
  { id: 'frequent', icon: 'repeat', label: t('nav.frequent') },
  { id: 'rewards', icon: 'award', label: t('nav.rewards') },
  { id: 'profile', icon: 'settings', label: t('nav.profile') },
])

const activeTab = computed(() => {
  if (route.path.startsWith('/tasks')) return 'tasks'
  if (route.path.startsWith('/frequent')) return 'frequent'
  if (route.path.startsWith('/rewards')) return 'rewards'
  if (route.path.startsWith('/profile')) return 'profile'
  return 'today'
})

const showChrome = computed(() => route.meta.chrome !== false)

function handleTabChange(id: string) {
  router.push(`/${id}`)
}
</script>

<template>
  <div class="surface-app relative h-dvh overflow-hidden" :data-theme="theme">
    <div class="absolute inset-0 overflow-y-auto">
      <RouterView />
    </div>
    <AppBottomNav
      v-if="showChrome"
      class="absolute inset-x-0 bottom-0"
      :model-value="activeTab"
      :items="navItems"
      @update:model-value="handleTabChange"
    />
    <RewardBurst :show="isVisible" @close="hide" />

    <Teleport to="body">
      <Transition name="error-toast">
        <div
          v-if="errorKey"
          class="fixed top-6 right-4 left-4 z-[60] mx-auto flex max-w-sm justify-center"
        >
          <AppToast variant="gentle" class="cursor-pointer" @click="hideError">
            {{ t(errorKey) }}
          </AppToast>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.error-toast-enter-active,
.error-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.error-toast-enter-from,
.error-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
