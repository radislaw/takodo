<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppProgressRing, AppToast, AppIcon, AppButton, AppInput, StreakFlame } from '@/shared/ui'
import {
  useAddDailyEntry,
  useMoveToTomorrow,
  useUpdateDailyEntry,
  useCreateTask,
  useCompleteTask,
  useReopenTask,
  useProfile,
  useRewards,
} from '@/shared/api'
import { useErrorToast } from '@/shared/lib/useErrorToast'
import { useSuccessToast } from '@/shared/lib/useSuccessToast'
import { useReward } from '@/shared/lib/useReward'
import { CATEGORIES, CAT_COLORS } from '@/shared/lib/categories'
import { useTodayLogic } from './useTodayLogic'
import TodayTaskCard from './TodayTaskCard.vue'
import QuestPanel from './QuestPanel.vue'
import ComebackBanner from './ComebackBanner.vue'
import BrainDumpBar from './BrainDumpBar.vue'
import FocusNowCard from './FocusNowCard.vue'
import CategoriesCard from './CategoriesCard.vue'
import EveningJournal from './EveningJournal.vue'
import { SoftNote } from '@/shared/ui'

const { t } = useI18n({ useScope: 'global' })
const { showError } = useErrorToast()
const { showSuccess } = useSuccessToast()

const {
  isPending,
  taskMap,
  childProgress,
  entries,
  doneCount,
  activeEntries,
  doneEntries,
  nextTask,
  categoryCounts,
  summaryMsg,
} = useTodayLogic()

const { data: profile } = useProfile()
const { data: rewards } = useRewards()

const { mutateAsync: createTaskAsync } = useCreateTask()
const { mutateAsync: addEntryAsync } = useAddDailyEntry()
const { mutate: completeTask } = useCompleteTask()
const { mutate: reopenTask } = useReopenTask()
const { mutateAsync: updateEntryAsync } = useUpdateDailyEntry()
const { mutateAsync: moveToTomorrowAsync } = useMoveToTomorrow()

const showSheet = ref(false)
const newTitle = ref('')
const newCategory = ref<'home' | 'health' | 'work' | 'self' | null>(null)
const isAdding = ref(false)
const showMitLimitToast = ref(false)
let mitToastTimer: ReturnType<typeof setTimeout> | null = null
const inputRef = ref<InstanceType<typeof AppInput> | null>(null)

const greetingKey = computed(() => {
  const h = new Date().getHours()
  if (h < 5) return 'greeting.night'
  if (h < 12) return 'greeting.morning'
  if (h < 18) return 'greeting.afternoon'
  return 'greeting.evening'
})

const { celebrate } = useReward()

const userName = computed(() => profile.value?.name ?? '')
const streak = computed(() => rewards.value?.streak ?? 0)
const shields = computed(() => rewards.value?.shields ?? 0)
const shieldUsedRecently = computed(() => rewards.value?.shieldUsedRecently ?? false)
const isComeback = computed(() => (rewards.value?.comebackDays ?? 0) >= 2)

watch(
  () => rewards.value?.streak,
  (next, prev) => {
    // prev === undefined is the initial query load — celebrating there would
    // re-fire the epic burst on every page open while the streak sits at 21.
    if (prev !== undefined && next === 21 && prev < 21) {
      celebrate({ epic: true })
    }
  },
)

const greetingFull = computed(() => {
  const base = t(greetingKey.value)
  return userName.value ? `${base}, ${userName.value}` : base
})

// Evening journal is a reflective, end-of-day surface — only show it in the
// evening/night so the morning view stays focused on the task list.
const isEvening = computed(
  () => greetingKey.value === 'greeting.evening' || greetingKey.value === 'greeting.night',
)

function openSheet() {
  newTitle.value = ''
  newCategory.value = null
  showSheet.value = true
}

function closeSheet() {
  showSheet.value = false
}

function focusInput() {
  inputRef.value?.focus()
}

async function addTask(title: string, category?: (typeof CATEGORIES)[number] | null) {
  isAdding.value = true
  try {
    const task = await createTaskAsync({
      title,
      ...(category ? { category } : {}),
    })
    await addEntryAsync(task.id)
    return true
  } catch {
    showError('errors.addFailed')
    return false
  } finally {
    isAdding.value = false
  }
}

async function handleAdd() {
  const title = newTitle.value.trim()
  if (!title) return
  const added = await addTask(title, newCategory.value)
  if (added) {
    newTitle.value = ''
    newCategory.value = null
    nextTick(() => inputRef.value?.focus())
  }
}

function handleToggleDone(taskId: string, currentStatus: string) {
  if (currentStatus === 'done') reopenTask(taskId)
  else completeTask(taskId)
}

async function handleMoveTomorrow(entryId: string, taskId: string) {
  try {
    await moveToTomorrowAsync({ entryId, taskId })
    showSuccess('today.movedTomorrow')
  } catch {
    // error toast shown by mutation
  }
}

async function handleToggleMIT(entryId: string, currentMIT: boolean) {
  try {
    await updateEntryAsync({ entryId, isMIT: !currentMIT })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'mit_limit') {
      showMitLimitToast.value = true
      if (mitToastTimer) clearTimeout(mitToastTimer)
      mitToastTimer = setTimeout(() => {
        showMitLimitToast.value = false
      }, 3000)
    }
  }
}
</script>

<template>
  <div class="surface-app pb-nav min-h-full">
    <!-- MIT limit toast -->
    <Transition name="fade">
      <div v-if="showMitLimitToast" class="fixed top-6 right-4 left-4 z-50 mx-auto max-w-sm">
        <AppToast variant="gentle">
          {{ t('today.mitLimitToast') }}
        </AppToast>
      </div>
    </Transition>

    <main class="px-4 pt-14 pb-4 md:px-8 lg:pt-8">
      <div class="lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-[22px]">
        <div class="min-w-0">
          <!-- Greeting -->
          <div class="mb-5">
            <h1 class="font-display text-ink text-2xl leading-tight font-extrabold md:text-[2rem]">
              {{ greetingFull }}
            </h1>
            <p class="font-body text-ink-soft mt-0.5 text-sm">{{ t('greeting.subtitle') }}</p>
          </div>

          <!-- Comeback (anti-shame) banner -->
          <ComebackBanner v-if="isComeback" />

          <!-- Inline brain dump — primary zero-friction capture at every breakpoint -->
          <BrainDumpBar class="mb-5" :disabled="isAdding" @submit="addTask" />

          <!-- Summary card -->
          <div class="surface-card mb-6 flex items-center gap-4 rounded-2xl p-4 shadow-md">
            <AppProgressRing
              :done="doneCount"
              :total="entries.length || 1"
              :aria-label="t('today.progressAria', { done: doneCount, total: entries.length })"
            />
            <div class="min-w-0 flex-1">
              <p class="font-body text-ink text-sm leading-snug font-semibold">{{ summaryMsg }}</p>
              <div v-if="streak > 0" class="mt-2 flex flex-wrap gap-1.5">
                <StreakFlame
                  :streak="streak"
                  :shields="shields"
                  :shield-used-recently="shieldUsedRecently"
                />
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="isPending" class="text-ink-soft font-body py-12 text-center text-sm">
            {{ t('today.loading') }}
          </div>

          <!-- Empty state -->
          <div
            v-else-if="entries.length === 0"
            class="text-ink-soft font-body py-12 text-center text-sm"
          >
            {{ t('today.emptyState') }}
          </div>

          <template v-else>
            <!-- Active section -->
            <template v-if="activeEntries.length > 0">
              <p class="font-body text-ink-soft mb-2 text-xs font-bold tracking-widest uppercase">
                {{ t('today.sections.active') }}
              </p>
              <div
                class="mb-5 flex flex-col gap-2.5 md:grid md:grid-cols-2 md:items-start md:gap-3 lg:flex lg:flex-col"
              >
                <TodayTaskCard
                  v-for="entry in activeEntries"
                  :key="entry.id"
                  :entry="entry"
                  :task="taskMap.get(entry.taskId)"
                  :child-done="childProgress.get(entry.taskId)?.done"
                  :child-total="childProgress.get(entry.taskId)?.total"
                  @toggle-done="handleToggleDone"
                  @toggle-mit="handleToggleMIT"
                  @move-tomorrow="handleMoveTomorrow"
                />
              </div>
            </template>

            <!-- Done section -->
            <template v-if="doneEntries.length > 0">
              <p class="font-body text-ink-soft mb-2 text-xs font-bold tracking-widest uppercase">
                {{ t('today.sections.done') }}
              </p>
              <div
                class="flex flex-col gap-2.5 md:grid md:grid-cols-2 md:items-start md:gap-3 lg:flex lg:flex-col"
              >
                <TodayTaskCard
                  v-for="entry in doneEntries"
                  :key="entry.id"
                  :entry="entry"
                  :task="taskMap.get(entry.taskId)"
                  :child-done="childProgress.get(entry.taskId)?.done"
                  :child-total="childProgress.get(entry.taskId)?.total"
                  @toggle-done="handleToggleDone"
                  @toggle-mit="handleToggleMIT"
                />
              </div>
            </template>
          </template>

          <!-- Zone C — secondary surfaces, subordinated below the task spine by a divider -->
          <div class="border-line mt-6 flex flex-col gap-5 border-t pt-6">
            <QuestPanel />

            <!-- Evening journal: log already-done tasks + thoughts of the day (evening/night only) -->
            <EveningJournal v-if="isEvening" />
          </div>
        </div>

        <!-- Desktop right rail -->
        <aside class="hidden lg:sticky lg:top-8 lg:flex lg:flex-col lg:gap-4">
          <FocusNowCard :title="nextTask?.title" :task-id="nextTask?.id" />
          <CategoriesCard :counts="categoryCounts" />
          <SoftNote>{{ t('today.softNote') }}</SoftNote>
        </aside>
      </div>
    </main>

    <!-- FAB -->
    <Teleport to="body">
      <button
        type="button"
        class="bg-sage fixed z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 lg:hidden"
        style="bottom: calc(5rem + env(safe-area-inset-bottom) + 0.75rem); right: 1.25rem"
        :aria-label="t('today.add.title')"
        @click="openSheet"
      >
        <AppIcon name="plus" :size="24" color="#fff" :stroke-width="2.5" />
      </button>
    </Teleport>

    <!-- Add sheet -->
    <Teleport to="body">
      <Transition name="sheet" :duration="{ enter: 300, leave: 250 }" @after-enter="focusInput">
        <div
          v-if="showSheet"
          class="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center"
        >
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeSheet" />
          <div
            class="surface-card relative rounded-t-3xl px-5 pt-5 shadow-xl sm:w-full sm:max-w-md sm:rounded-3xl"
            style="padding-bottom: calc(2rem + env(safe-area-inset-bottom))"
          >
            <div class="mb-4 flex items-start justify-between">
              <div>
                <h2 class="font-display text-ink text-lg font-extrabold">
                  {{ t('today.add.title') }}
                </h2>
                <p class="text-ink-soft mt-0.5 text-xs">{{ t('today.add.subtitle') }}</p>
              </div>
              <button
                type="button"
                class="text-ink-soft hover:text-ink cursor-pointer"
                @click="closeSheet"
              >
                <AppIcon name="x" :size="22" />
              </button>
            </div>

            <AppInput
              ref="inputRef"
              v-model="newTitle"
              :placeholder="t('today.add.placeholder')"
              class="mb-4"
              @keydown.enter="handleAdd"
              @keydown.esc="closeSheet"
            />

            <p class="text-ink-soft mb-2 text-xs font-semibold">
              {{ t('today.add.categoryLabel') }}
            </p>
            <div class="mb-5 flex flex-wrap gap-2">
              <button
                v-for="cat in CATEGORIES"
                :key="cat"
                type="button"
                class="border-line flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors"
                :class="newCategory === cat ? 'border-transparent text-white' : 'text-ink-soft'"
                :style="newCategory === cat ? { background: CAT_COLORS[cat] } : {}"
                @click="newCategory = newCategory === cat ? null : cat"
              >
                <span class="h-2 w-2 rounded-full" :style="{ background: CAT_COLORS[cat] }" />
                {{ t(`category.${cat}`) }}
              </button>
            </div>

            <AppButton
              variant="primary"
              :disabled="isAdding || !newTitle.trim()"
              class="w-full"
              @click="handleAdd"
            >
              {{ t('today.add.button') }}
            </AppButton>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}
.sheet-enter-active .surface-card,
.sheet-leave-active .surface-card {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .surface-card,
.sheet-leave-to .surface-card {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .sheet-enter-active,
  .sheet-leave-active,
  .sheet-enter-active .surface-card,
  .sheet-leave-active .surface-card {
    transition: none;
  }
}
</style>
