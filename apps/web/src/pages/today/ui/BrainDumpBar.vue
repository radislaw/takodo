<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppInput } from '@/shared/ui'

defineProps<{ disabled?: boolean }>()

const emit = defineEmits<{ submit: [title: string] }>()

const { t } = useI18n({ useScope: 'global' })
const title = ref('')

function handleEnter() {
  const trimmed = title.value.trim()
  if (!trimmed) return
  emit('submit', trimmed)
  title.value = ''
}
</script>

<template>
  <div class="surface-card flex items-center gap-3.5 rounded-[28px] px-4 py-4 shadow-md">
    <span
      class="bg-sage-tint text-sage-deep flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
    >
      <AppIcon name="zap" :size="20" />
    </span>
    <AppInput
      v-model="title"
      class="flex-1"
      :placeholder="t('today.dump.placeholder')"
      :disabled="disabled"
      @keydown.enter="handleEnter"
    />
  </div>
</template>
