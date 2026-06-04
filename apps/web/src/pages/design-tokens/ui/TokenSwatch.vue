<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  name: string
  cssVar: string
  kind?: 'color' | 'surface' | 'shadow' | 'radius' | 'spacing' | 'text'
}>()
</script>

<template>
  <div class="token-swatch">
    <div
      v-if="kind === 'shadow'"
      class="swatch-box"
      :style="{ boxShadow: `var(${cssVar})`, background: 'var(--card)' }"
    />
    <div
      v-else-if="kind === 'radius'"
      class="swatch-box"
      :style="{
        borderRadius: `var(${cssVar})`,
        background: 'var(--sage-tint)',
      }"
    />
    <div v-else-if="kind === 'spacing'" class="swatch-bar" :style="{ width: `var(${cssVar})` }" />
    <div v-else-if="kind === 'text'" class="swatch-text ad-body">
      {{ t('design.tokens.pangramFull') }}
    </div>
    <div
      v-else
      class="swatch-box"
      :style="{ background: `var(${cssVar})`, border: '1px solid var(--line)' }"
    />
    <code class="swatch-label">{{ name }}</code>
  </div>
</template>

<style scoped>
.token-swatch {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  min-width: 0;
}

.swatch-box {
  width: 100%;
  height: 56px;
  border-radius: var(--r-sm);
}

.swatch-bar {
  height: 8px;
  min-width: 4px;
  max-width: 100%;
  border-radius: var(--r-pill);
  background: var(--sage);
}

.swatch-text {
  padding: var(--s-2) var(--s-3);
  border-radius: var(--r-sm);
  background: var(--card);
  border: 1px solid var(--line);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.swatch-label {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-soft);
  word-break: break-all;
}
</style>
