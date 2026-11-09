<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
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

// Target cell footprint — how wide one column wants to be before we add another.
const CELL_PX = 14

const rootEl = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
let observer: ResizeObserver | null = null

onMounted(() => {
  if (typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver((entries) => {
    containerWidth.value = entries[0]?.contentRect.width ?? 0
  })
  if (rootEl.value) observer.observe(rootEl.value)
})

onBeforeUnmount(() => observer?.disconnect())

const totalColumns = computed(() => Math.ceil(props.days.length / 7))

// Show as many trailing columns as fit at the target cell size; the visible
// columns then stretch (1fr) to fill the width exactly with small squares.
const columns = computed(() => {
  if (containerWidth.value <= 0) return totalColumns.value
  const fit = Math.max(1, Math.floor(containerWidth.value / CELL_PX))
  return Math.min(fit, totalColumns.value)
})

const visibleDays = computed(() => props.days.slice((totalColumns.value - columns.value) * 7))

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
    const first = visibleDays.value[c * 7]
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
  <div ref="rootEl" data-test="activity-heatmap" class="w-full" :style="{ '--gap': '3px' }">
    <!-- Month labels -->
    <div
      v-if="props.showLabels"
      data-test="heatmap-months"
      class="text-ink-faint mb-1 grid w-full text-[10px] font-semibold whitespace-nowrap"
      :style="{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        columnGap: 'var(--gap)',
      }"
      aria-hidden="true"
    >
      <span v-for="ml in monthLabels" :key="ml.col" :style="{ gridColumnStart: ml.col + 1 }">
        {{ ml.label }}
      </span>
    </div>

    <!-- Cells -->
    <div
      class="grid w-full grid-flow-col"
      :style="{
        gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
        gridAutoColumns: 'minmax(0, 1fr)',
        gap: 'var(--gap)',
      }"
      role="img"
      :aria-label="t('rewards.heatmap.title')"
    >
      <div
        v-for="day in visibleDays"
        :key="day.date"
        data-test="heatmap-cell"
        :data-date="day.date"
        :data-level="level(day.count)"
        :data-today="day.date === today"
        :data-shielded="day.shielded === true"
        class="aspect-square rounded-[2px]"
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
