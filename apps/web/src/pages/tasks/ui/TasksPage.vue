<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="surface-app min-h-dvh pb-24">
    <header class="surface-card border-line sticky top-0 z-10 border-b shadow-sm">
      <div class="px-5 py-4">
        <h1 class="font-display text-ink text-xl leading-tight font-extrabold">
          {{ t('tasks.title') }}
        </h1>
      </div>
    </header>
  </div>
</template>
