<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CAT_COLORS } from '@/shared/lib/categories'

defineProps<{
  counts: { category: string; count: number }[]
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div
    v-if="counts.length > 0"
    data-test="categories-card"
    class="surface-card rounded-[28px] p-4 shadow-sm"
  >
    <p class="text-ink-soft mb-3 text-xs font-bold tracking-widest uppercase">
      {{ t('today.categories.label') }}
    </p>
    <div class="flex flex-col gap-2.5">
      <div v-for="row in counts" :key="row.category" class="flex items-center gap-2.5">
        <span
          class="h-2 w-2 flex-shrink-0 rounded-full"
          :style="{ background: CAT_COLORS[row.category] ?? 'var(--ink-faint)' }"
        />
        <span class="font-body text-ink flex-1 text-sm font-semibold">
          {{ t(`category.${row.category}`) }}
        </span>
        <span class="text-ink-soft text-xs font-semibold">
          {{ t('today.categories.count', row.count) }}
        </span>
      </div>
    </div>
  </div>
</template>
