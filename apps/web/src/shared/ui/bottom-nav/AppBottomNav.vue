<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '../icon/AppIcon.vue'
import type { IconName } from '../icon/icons'

const { t } = useI18n()
const model = defineModel<string>({ required: true })

defineProps<{
  items: { id: string; icon: IconName; label: string }[]
}>()
</script>

<template>
  <nav
    :aria-label="t('a11y.mainNav')"
    class="surface-card border-line flex justify-around rounded-b-3xl border-t pt-2.5 pb-4"
  >
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      :aria-current="model === item.id ? 'page' : undefined"
      :class="[
        'font-body flex cursor-pointer flex-col items-center gap-0.5 border-none bg-transparent px-3 py-1 text-[10px] font-bold',
        model === item.id ? 'text-sage-deep' : 'text-ink-faint',
      ]"
      @click="model = item.id"
    >
      <AppIcon :name="item.icon" :size="21" :stroke-width="model === item.id ? 2.4 : 2" />
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>
