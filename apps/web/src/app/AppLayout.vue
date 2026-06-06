<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppBottomNav } from '@/shared/ui'
import type { IconName } from '@/shared/ui/icon/icons'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const navItems = computed<{ id: string; icon: IconName; label: string }[]>(() => [
  { id: 'today', icon: 'home', label: t('nav.today') },
  { id: 'tasks', icon: 'layers', label: t('nav.tasks') },
  { id: 'frequent', icon: 'flame', label: t('nav.frequent') },
])

const activeTab = computed(() => {
  if (route.path.startsWith('/tasks')) return 'tasks'
  if (route.path.startsWith('/frequent')) return 'frequent'
  return 'today'
})

const showChrome = computed(() => route.meta.chrome !== false)

function handleTabChange(id: string) {
  router.push(`/${id}`)
}
</script>

<template>
  <div class="surface-app flex min-h-dvh flex-col">
    <div class="flex-1 overflow-y-auto">
      <RouterView />
    </div>
    <AppBottomNav
      v-if="showChrome"
      :model-value="activeTab"
      :items="navItems"
      @update:model-value="handleTabChange"
    />
  </div>
</template>
