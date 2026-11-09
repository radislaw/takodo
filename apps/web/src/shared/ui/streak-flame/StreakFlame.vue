<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/ui'

const props = defineProps<{
  streak: number
  shields: number
  shieldUsedRecently?: boolean
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div v-if="props.streak > 0" data-test="streak-flame" class="inline-flex flex-wrap gap-1.5">
    <div class="bg-apricot/15 inline-flex items-center gap-1 rounded-full px-2.5 py-1">
      <AppIcon name="flame" :size="13" class="text-apricot-deep" />
      <span class="text-apricot-deep text-xs font-bold">
        {{ t('today.streak', { days: props.streak }) }}
      </span>
      <span
        v-if="props.shields > 0"
        data-test="shield-pips"
        class="inline-flex items-center gap-0.5"
        :aria-label="t('today.shieldsAria', { count: props.shields })"
      >
        <AppIcon
          v-for="i in props.shields"
          :key="i"
          data-test="shield-pip"
          name="shield"
          :size="11"
          class="text-apricot-deep opacity-80"
        />
      </span>
    </div>
    <div
      v-if="props.shieldUsedRecently"
      class="bg-sage/15 inline-flex items-center gap-1 rounded-full px-2.5 py-1"
    >
      <AppIcon name="shield" :size="13" class="text-sage-deep" />
      <span class="text-sage-deep text-xs font-bold">{{ t('today.shieldActive') }}</span>
    </div>
  </div>
</template>
