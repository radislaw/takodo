<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppProgressRing, AppToast, AppIcon, AppButton, AppInput, StreakFlame } from '@/shared/ui'
import {
  useDailyToday,
  useAddDailyEntry,
  useMoveToTomorrow,
  useUpdateDailyEntry,
  useTasks,
  useCreateTask,
  useCompleteTask,
  useReopenTask,
  useProfile,
  useRewards,
} from '@/shared/api'
import { useErrorToast } from '@/shared/lib/useErrorToast'
import { useSuccessToast } from '@/shared/lib/useSuccessToast'
import { useReward } from '@/shared/lib/useReward'
import TodayTaskCard from './TodayTaskCard.vue'

const { t } = useI18n({ useScope: 'global' })
const { showError } = useErrorToast()
const { showSuccess } = useSuccessToast()

const { data: daily, isPending } = useDailyToday()
const { data: taskList } = useTasks()
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

const CATEGORIES = ['home', 'health', 'work', 'self'] as const

const CAT_COLORS: Record<string, string> = {
  home: 'var(--cat-sage)',
  health: 'var(--cat-apricot)',
  work: 'var(--cat-blue)',
  self: 'var(--cat-mauve)',
}

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
const level = computed(() => rewards.value?.level ?? 1)

watch(
  () => rewards.value?.streak,
  (next, prev) => {
    if (next === 21 && (prev ?? 0) < 21) {
      celebrate({ epic: true })
    }
  },
)

const greetingFull = computed(() => {
  const base = t(greetingKey.value)
  return userName.value ? `${base}, ${userName.value}` : base
})

const taskMap = computed(() => {
  const map = new Map<
    string,
    { id: string; title: string; status: string; category?: string | null }
  >()
  for (const task of taskList.value ?? []) map.set(task.id, task)
  return map
})

const childProgress = computed(() => {
  const map = new Map<string, { done: number; total: number }>()
  for (const task of taskList.value ?? []) {
    if (!task.parentId) continue
    const entry = map.get(task.parentId) ?? { done: 0, total: 0 }
    entry.total++
    if (task.status === 'done') entry.done++
    map.set(task.parentId, entry)
  }
  return map
})

const entries = computed(() => daily.value?.entries ?? [])

const doneCount = computed(
  () => entries.value.filter((e) => taskMap.value.get(e.taskId)?.status === 'done').length,
)

const mitCount = computed(() => entries.value.filter((e) => e.isMIT).length)

const activeEntries = computed(() =>
  entries.value
    .filter((e) => taskMap.value.get(e.taskId)?.status !== 'done')
    .sort((a, b) => Number(b.isMIT) - Number(a.isMIT)),
)

const doneEntries = computed(() =>
  entries.value.filter((e) => taskMap.value.get(e.taskId)?.status === 'done'),
)

const summaryMsg = computed(() => {
  const left = entries.value.length - doneCount.value
  if (entries.value.length === 0) return t('today.summary.start')
  if (left === 0) return t('today.summary.all_done')
  if (left <= 2) return t('today.summary.almost')
  return t('today.summary.start')
})

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

async function handleAdd() {
  const title = newTitle.value.trim()
  if (!title) return
  isAdding.value = true
  try {
    const task = await createTaskAsync({
      title,
      ...(newCategory.value ? { category: newCategory.value } : {}),
    })
    await addEntryAsync(task.id)
    newTitle.value = ''
    newCategory.value = null
    nextTick(() => inputRef.value?.focus())
  } catch {
    showError('errors.addFailed')
  } finally {
    isAdding.value = false
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

    <main class="mx-auto max-w-xl px-4 pt-14 pb-4">
      <!-- Greeting -->
      <div class="mb-5">
        <h1 class="font-display text-ink text-2xl leading-tight font-extrabold">
          {{ greetingFull }}
        </h1>
        <p class="font-body text-ink-soft mt-0.5 text-sm">{{ t('greeting.subtitle') }}</p>
      </div>

      <!-- Summary card -->
      <div class="surface-card mb-6 flex items-center gap-4 rounded-2xl p-4 shadow-md">
        <AppProgressRing
          :done="doneCount"
          :total="entries.length || 1"
          :aria-label="t('today.progressAria', { done: doneCount, total: entries.length })"
        />
        <div class="min-w-0 flex-1">
          <p class="font-body text-ink text-sm leading-snug font-semibold">{{ summaryMsg }}</p>
          <div
            v-if="streak > 0 || entries.length > 0 || level > 1"
            class="mt-2 flex flex-wrap gap-1.5"
          >
            <StreakFlame
              v-if="streak > 0"
              :streak="streak"
              :shields="shields"
              :shield-used-recently="shieldUsedRecently"
            />
            <div
              v-if="entries.length > 0"
              class="bg-sage/10 inline-flex items-center gap-1 rounded-full px-2.5 py-1"
            >
              <AppIcon name="zap" :size="13" class="text-sage-deep" />
              <span class="text-sage-deep text-xs font-bold">{{
                t('today.mitCounter', { count: mitCount })
              }}</span>
            </div>
            <div
              v-if="level > 1"
              data-test="level-chip"
              class="bg-cat-mauve/15 inline-flex items-center rounded-full px-2.5 py-1"
            >
              <span class="text-cat-mauve text-xs font-bold">{{
                t('today.level', { n: level })
              }}</span>
            </div>
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
          <div class="mb-5 flex flex-col">
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
          <div class="flex flex-col">
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
    </main>

    <!-- FAB -->
    <Teleport to="body">
      <button
        type="button"
        class="bg-sage fixed z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
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
        <div v-if="showSheet" class="fixed inset-0 z-50 flex flex-col justify-end">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeSheet" />
          <div
            class="surface-card relative rounded-t-3xl px-5 pt-5 shadow-xl"
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
