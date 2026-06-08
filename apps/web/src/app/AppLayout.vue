<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppBottomNav, RewardBurst } from '@/shared/ui'
import type { IconName } from '@/shared/ui/icon/icons'
import { useReward } from '@/shared/lib/useReward'
import { useProfile } from '@/shared/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const { isVisible, hide } = useReward()
const { data: profile } = useProfile()

const theme = computed(() => profile.value?.theme ?? 'amoled')

const navItems = computed<{ id: string; icon: IconName; label: string }[]>(() => [
  { id: 'today', icon: 'home', label: t('nav.today') },
  { id: 'tasks', icon: 'layers', label: t('nav.tasks') },
  { id: 'rewards', icon: 'award', label: t('nav.rewards') },
  { id: 'profile', icon: 'settings', label: t('nav.profile') },
])

const activeTab = computed(() => {
  if (route.path.startsWith('/tasks')) return 'tasks'
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
  </div>
</template>
