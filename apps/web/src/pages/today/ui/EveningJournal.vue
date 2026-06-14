<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppInput, AppButton } from '@/shared/ui'
import { useDailyToday, useLogDoneTask, useUpdateDailyNote } from '@/shared/api'

const { t } = useI18n({ useScope: 'global' })

const { data: daily } = useDailyToday()
const { mutateAsync: logDone, isLoading: isLogging } = useLogDoneTask()
const { mutateAsync: saveNote } = useUpdateDailyNote()

const doneTitle = ref('')
const note = ref('')

// Seed the note from the server once it loads, but never clobber what the user
// is actively typing (server echoes the same value back after a save).
let saveTimer: ReturnType<typeof setTimeout> | null = null
let lastSaved = ''

// Seed once the daily list has loaded — keyed on the list itself, not the note,
// so a day with no note yet (note === undefined) still unlocks saving.
let noteSeeded = false
watch(
  () => daily.value,
  (loaded) => {
    if (!noteSeeded && loaded) {
      note.value = loaded.note ?? ''
      lastSaved = note.value
      noteSeeded = true
    }
  },
  { immediate: true },
)

function flushNote() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  const next = note.value
  if (!noteSeeded || next === lastSaved) return
  lastSaved = next
  void saveNote(next)
}

function onNoteInput() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(flushNote, 800)
}

onBeforeUnmount(flushNote)

const canLog = computed(() => doneTitle.value.trim().length > 0 && !isLogging.value)

async function handleLog() {
  const title = doneTitle.value.trim()
  if (!title) return
  try {
    await logDone(title)
    doneTitle.value = ''
  } catch {
    // Error toast surfaced by the composable's onError.
  }
}
</script>

<template>
  <section class="surface-card mt-5 rounded-2xl p-5 shadow-md" data-test="evening-journal">
    <div class="mb-4 flex items-center gap-3">
      <div
        class="bg-cat-mauve/15 text-cat-mauve flex h-10 w-10 items-center justify-center rounded-[11px]"
      >
        <AppIcon name="moon" :size="20" />
      </div>
      <div>
        <div class="text-ink text-sm font-bold">{{ t('today.evening.label') }}</div>
        <div class="text-ink-soft text-xs">{{ t('today.evening.sub') }}</div>
      </div>
    </div>

    <!-- Log an already-done task -->
    <label class="text-ink-soft mb-1.5 block text-xs font-semibold">
      {{ t('today.evening.logLabel') }}
    </label>
    <div class="mb-4 flex gap-2">
      <AppInput
        v-model="doneTitle"
        data-test="evening-done-input"
        :placeholder="t('today.evening.logPlaceholder')"
        class="flex-1"
        @keydown.enter="handleLog"
      />
      <AppButton
        variant="primary"
        data-test="evening-done-submit"
        :disabled="!canLog"
        @click="handleLog"
      >
        {{ t('today.evening.logButton') }}
      </AppButton>
    </div>

    <!-- Thoughts & events of the day -->
    <label class="text-ink-soft mb-1.5 block text-xs font-semibold">
      {{ t('today.evening.noteLabel') }}
    </label>
    <textarea
      v-model="note"
      data-test="evening-note"
      rows="4"
      maxlength="5000"
      :placeholder="t('today.evening.notePlaceholder')"
      class="border-line surface-app text-ink w-full resize-none rounded-xl border px-3 py-2.5 text-sm"
      @input="onNoteInput"
      @blur="flushNote"
    />
    <div class="text-ink-faint mt-1 text-right text-xs" data-test="evening-note-count">
      {{ t('today.evening.charCount', { n: note.length }) }}
    </div>
  </section>
</template>
