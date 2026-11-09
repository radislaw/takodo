<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/ui'

const { t } = useI18n({ useScope: 'global' })

const dismissed = ref(false)
</script>

<template>
  <div
    v-if="!dismissed"
    data-test="comeback-banner"
    class="bg-sage/10 mb-5 flex items-start gap-3 rounded-2xl p-4"
  >
    <span class="bg-sage flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full">
      <AppIcon name="sparkles" :size="18" color="#fff" />
    </span>

    <div class="min-w-0 flex-1">
      <p class="font-display text-ink text-sm font-bold">{{ t('comeback.title') }}</p>
      <p class="font-body text-ink-soft mt-0.5 text-xs leading-snug">
        {{ t('comeback.message') }}
      </p>
    </div>

    <button
      type="button"
      data-test="comeback-dismiss"
      class="text-ink-soft hover:text-ink -mt-1 -mr-1 cursor-pointer rounded-full border-none bg-transparent p-1"
      :aria-label="t('comeback.dismissAria')"
      @click="dismissed = true"
    >
      <AppIcon name="x" :size="16" />
    </button>
  </div>
</template>
