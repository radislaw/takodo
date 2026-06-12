<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon } from '@/shared/ui'

const props = defineProps<{
  title?: string
  taskId?: string
}>()

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()

function startFocus() {
  router.push({ path: '/do', query: { task: props.taskId } })
}
</script>

<template>
  <div class="surface-card rounded-[28px] p-5 shadow-md">
    <p class="text-sage-deep text-xs font-bold tracking-widest uppercase">
      {{ t('today.focus.label') }}
    </p>
    <template v-if="title">
      <p class="font-display text-ink mt-2.5 text-base leading-snug font-extrabold">
        {{ title }}
      </p>
      <AppButton variant="primary" class="mt-4 w-full" @click="startFocus">
        <span class="inline-flex items-center justify-center gap-2">
          <AppIcon name="play" :size="16" color="#fff" />
          {{ t('today.focus.start') }}
        </span>
      </AppButton>
    </template>
    <p v-else class="text-ink-soft font-body mt-2.5 text-sm">
      {{ t('today.summary.all_done') }}
    </p>
  </div>
</template>
