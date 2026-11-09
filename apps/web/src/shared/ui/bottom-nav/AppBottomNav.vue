<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '../icon/AppIcon.vue'
import type { IconName } from '../icon/icons'

const { t } = useI18n({ useScope: 'global' })
const model = defineModel<string>({ required: true })

defineProps<{
  items: { id: string; icon: IconName; label: string }[]
}>()
</script>

<template>
  <nav
    :aria-label="t('a11y.mainNav')"
    class="surface-nav border-line border-t pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
  >
    <div class="mx-auto flex w-full max-w-xl justify-around">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        :aria-current="model === item.id ? 'page' : undefined"
        :class="[
          'font-body flex min-h-[44px] cursor-pointer flex-col items-center justify-center gap-0.5 border-none bg-transparent px-4 py-2 text-[11px] font-bold',
          model === item.id ? 'text-sage-deep' : 'text-[color:var(--nav-inactive)]',
        ]"
        @click="model = item.id"
      >
        <AppIcon :name="item.icon" :size="22" :stroke-width="model === item.id ? 2.4 : 2" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>
