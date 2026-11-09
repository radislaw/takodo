<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  AppBottomNav,
  AppSidebar,
  RewardBurst,
  AppToast,
  ThemeToggle,
  GiftModal,
} from '@/shared/ui'
import type { IconName } from '@/shared/ui/icon/icons'
import { useReward } from '@/shared/lib/useReward'
import { useErrorToast } from '@/shared/lib/useErrorToast'
import { useSuccessToast } from '@/shared/lib/useSuccessToast'
import { useUndoDelete } from '@/shared/lib/useUndoDelete'
import { useProgressCelebration } from '@/shared/lib/useProgressCelebration'
import { useProfile, useUpdateProfile, useRewards } from '@/shared/api'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })
const { isVisible, isEpic, hide } = useReward()
const { key: errorKey, hideError } = useErrorToast()
const { key: successKey, hideSuccess } = useSuccessToast()
const { pending: undoPending } = useUndoDelete()
const { data: profile } = useProfile()
const { mutate: updateProfile } = useUpdateProfile()
const { data: rewards } = useRewards()
const { current: celebration, dismiss: dismissCelebration } = useProgressCelebration()

const theme = computed(() => profile.value?.theme ?? 'light')

// The light/dark toggle is itself a first-task reward — hidden until then.
const firstTaskDone = computed(
  () => rewards.value?.badges?.find((b) => b.id === 'first_step')?.earned ?? false,
)

function handleThemeSelect(target: string) {
  updateProfile({ theme: target as Parameters<typeof updateProfile>[0]['theme'] })
}

watch(
  () => profile.value?.language,
  (lang) => {
    if (lang === 'en' || lang === 'ru') locale.value = lang
  },
  { immediate: true },
)

const navItems = computed<{ id: string; icon: IconName; label: string }[]>(() => [
  { id: 'today', icon: 'home', label: t('nav.today') },
  { id: 'assistant', icon: 'sparkles', label: t('nav.assistant') },
  { id: 'tasks', icon: 'layers', label: t('nav.tasks') },
  { id: 'frequent', icon: 'repeat', label: t('nav.frequent') },
  { id: 'rewards', icon: 'award', label: t('nav.rewards') },
  { id: 'profile', icon: 'settings', label: t('nav.profile') },
])

const activeTab = computed(() => {
  if (route.path.startsWith('/assistant')) return 'assistant'
  if (route.path.startsWith('/tasks')) return 'tasks'
  if (route.path.startsWith('/frequent')) return 'frequent'
  if (route.path.startsWith('/rewards')) return 'rewards'
  if (route.path.startsWith('/profile')) return 'profile'
  return 'today'
})

const sidebarMainItems = computed(() => navItems.value.filter((item) => item.id !== 'profile'))
const profileItem = computed(() => navItems.value.find((item) => item.id === 'profile'))

const showChrome = computed(() => route.meta.chrome !== false)

function handleTabChange(id: string) {
  router.push(`/${id}`)
}
</script>

<template>
  <div class="surface-app relative flex h-dvh overflow-hidden" :data-theme="theme">
    <AppSidebar
      v-if="showChrome"
      class="hidden lg:flex"
      :model-value="activeTab"
      :items="sidebarMainItems"
      :footer-item="profileItem"
      :streak="rewards?.streak ?? 0"
      :shields="rewards?.shields ?? 0"
      :shield-used-recently="rewards?.shieldUsedRecently ?? false"
      @update:model-value="handleTabChange"
    />
    <div class="relative h-full min-w-0 flex-1">
      <div class="absolute inset-0 overflow-y-auto">
        <RouterView />
      </div>
      <AppBottomNav
        v-if="showChrome"
        class="absolute inset-x-0 bottom-0 lg:hidden"
        :model-value="activeTab"
        :items="navItems"
        @update:model-value="handleTabChange"
      />
    </div>
    <ThemeToggle v-if="showChrome && firstTaskDone" :theme="theme" @select="handleThemeSelect" />
    <RewardBurst :show="isVisible" :epic="isEpic" @close="hide" />
    <GiftModal :event="celebration" @dismiss="dismissCelebration" />

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

    <Teleport to="body">
      <Transition name="error-toast">
        <div
          v-if="successKey"
          class="fixed top-6 right-4 left-4 z-[60] mx-auto flex max-w-sm justify-center"
        >
          <AppToast variant="sage" class="cursor-pointer" @click="hideSuccess">
            {{ t(successKey) }}
          </AppToast>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="error-toast">
        <div
          v-if="undoPending"
          class="fixed top-6 right-4 left-4 z-[61] mx-auto flex max-w-sm justify-center"
        >
          <AppToast variant="gentle" class="flex items-center gap-3">
            <span>{{ t('undo.taskDeleted') }}</span>
            <button
              type="button"
              class="text-sage font-body ml-1 cursor-pointer text-sm font-bold"
              @click="undoPending!.cancel()"
            >
              {{ t('undo.cancel') }}
            </button>
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
