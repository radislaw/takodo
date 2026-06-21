<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQueryCache } from '@pinia/colada'
import { AppIcon, AppButton } from '@/shared/ui'
import { useFrequent, useCreateTask, useAddDailyEntry } from '@/shared/api'
import { useSuccessToast } from '@/shared/lib/useSuccessToast'

const { t } = useI18n({ useScope: 'global' })
const queryCache = useQueryCache()
const { data: frequent, isPending } = useFrequent()
const { mutateAsync: createTask } = useCreateTask()
const { mutateAsync: addEntry } = useAddDailyEntry()
const { showSuccess } = useSuccessToast()

async function handleReAdd(title: string) {
  const task = await createTask({ title })
  await addEntry(task.id)
  queryCache.invalidateQueries({ key: ['frequent'] })
  showSuccess('success.addedToToday')
}
</script>

<template>
  <div class="surface-app pb-nav min-h-full">
    <header class="surface-card border-line sticky top-0 z-10 border-b shadow-sm">
      <div class="px-5 py-4">
        <h1 class="font-display text-ink text-xl leading-tight font-extrabold">
          {{ t('frequent.title') }}
        </h1>
        <p class="text-ink-soft mt-0.5 text-xs">{{ t('frequent.hint') }}</p>
      </div>
    </header>

    <main class="px-4 pt-6 md:px-8">
      <div v-if="isPending" class="text-ink-soft font-body py-12 text-center text-sm">
        {{ t('frequent.loading') }}
      </div>

      <div v-else-if="!frequent?.length" class="text-ink-soft font-body py-12 text-center text-sm">
        {{ t('frequent.empty') }}
      </div>

      <ul v-else class="flex flex-col gap-2">
        <li
          v-for="item in frequent"
          :key="item.normalizedTitle"
          class="surface-card flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm"
        >
          <AppIcon name="flame" :size="18" class="text-apricot flex-shrink-0" />

          <div class="min-w-0 flex-1">
            <p class="font-body text-ink truncate text-sm font-medium">{{ item.title }}</p>
            <p class="text-ink-soft text-xs">
              {{ t('frequent.undoneDays', { n: item.undoneDays }, { plural: item.undoneDays }) }}
            </p>
          </div>

          <AppButton variant="ghost" @click="handleReAdd(item.title)">
            {{ t('frequent.reAdd') }}
          </AppButton>
        </li>
      </ul>
    </main>
  </div>
</template>
