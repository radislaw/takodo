<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { todayDate } from '@/shared/api/daily'

interface HeatmapDay {
  date: string
  count: number
  shielded?: boolean
}

const props = withDefaults(
  defineProps<{
    days: HeatmapDay[]
    max: number
    showLabels?: boolean
  }>(),
  { showLabels: true },
)

const { t } = useI18n({ useScope: 'global' })

const today = computed(() => todayDate())
const columns = computed(() => Math.ceil(props.days.length / 7))

// 0 = empty; 1..4 buckets relative to the window's busiest day.
const LEVEL_CLASS = ['bg-sage/10', 'bg-sage/30', 'bg-sage/55', 'bg-sage/80', 'bg-sage']

function level(count: number): number {
  if (count <= 0) return 0
  if (props.max <= 1) return 4
  const ratio = count / props.max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

// Month label above the column where each new month first appears (days are
// Monday-aligned, so days[col*7] is that column's Monday).
const monthLabels = computed(() => {
  const labels: { col: number; label: string }[] = []
  let lastMonth = -1
  for (let c = 0; c < columns.value; c++) {
    const first = props.days[c * 7]
    if (!first || !first.date.includes('-')) continue
    const month = Number(first.date.slice(5, 7)) - 1
    if (month !== lastMonth) {
      labels.push({ col: c, label: t(`rewards.heatmap.months.${month}`) })
      lastMonth = month
    }
  }
  return labels
})

function cellAria(day: HeatmapDay): string {
  const dmy = day.date.includes('-') ? `${day.date.slice(8, 10)}.${day.date.slice(5, 7)}` : day.date
  return t('rewards.heatmap.cellAria', { date: dmy, count: day.count })
}
</script>

<template>
  <div
    data-test="activity-heatmap"
    class="overflow-x-auto"
    :style="{ '--cell': '0.6875rem', '--gap': '3px' }"
  >
    <!-- Month labels -->
    <div
      v-if="props.showLabels"
      data-test="heatmap-months"
      class="text-ink-faint mb-1 grid w-max text-[10px] font-semibold whitespace-nowrap"
      :style="{ gridTemplateColumns: `repeat(${columns}, var(--cell))`, columnGap: 'var(--gap)' }"
      aria-hidden="true"
    >
      <span v-for="ml in monthLabels" :key="ml.col" :style="{ gridColumnStart: ml.col + 1 }">
        {{ ml.label }}
      </span>
    </div>

    <!-- Cells -->
    <div
      class="grid w-max grid-flow-col"
      :style="{
        gridTemplateRows: 'repeat(7, var(--cell))',
        gridAutoColumns: 'var(--cell)',
        gap: 'var(--gap)',
      }"
      role="img"
      :aria-label="t('rewards.heatmap.title')"
    >
      <div
        v-for="day in props.days"
        :key="day.date"
        data-test="heatmap-cell"
        :data-date="day.date"
        :data-level="level(day.count)"
        :data-today="day.date === today"
        :data-shielded="day.shielded === true"
        class="rounded-[2px]"
        :style="{ width: 'var(--cell)', height: 'var(--cell)' }"
        :class="[
          LEVEL_CLASS[level(day.count)],
          day.date === today ? 'ring-sage-deep ring-1' : '',
          day.shielded ? 'ring-apricot/60 ring-1' : '',
        ]"
        :title="cellAria(day)"
        :aria-label="cellAria(day)"
      />
    </div>

    <!-- Legend -->
    <div
      v-if="props.showLabels"
      class="text-ink-faint mt-2 flex items-center justify-end gap-1 text-[10px] font-semibold"
    >
      <span>{{ t('rewards.heatmap.less') }}</span>
      <span
        v-for="lvl in [0, 1, 2, 3, 4]"
        :key="lvl"
        class="h-2.5 w-2.5 rounded-[2px]"
        :class="LEVEL_CLASS[lvl]"
      />
      <span>{{ t('rewards.heatmap.more') }}</span>
    </div>
  </div>
</template>
