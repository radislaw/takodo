<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/ui'
import { useQuests, useClaimQuest } from '@/shared/api'

const { t } = useI18n({ useScope: 'global' })
const { data: quests } = useQuests()
const { mutateAsync: claimQuest } = useClaimQuest()

const TIER_CLASS: Record<string, string> = {
  common: 'text-ink-soft',
  rare: 'text-sage-deep',
  epic: 'text-cat-mauve',
}

async function claim(id: string) {
  await claimQuest(id)
}
</script>

<template>
  <div v-if="quests" data-test="quest-panel" class="surface-card rounded-2xl p-5 shadow-md">
    <div class="mb-3 flex items-center gap-2">
      <AppIcon name="sparkles" :size="18" class="text-apricot-deep" />
      <h2 class="font-display text-ink text-base font-bold">{{ t('quests.title') }}</h2>
    </div>

    <ul class="flex flex-col gap-2.5">
      <li v-for="q in quests" :key="q.id" class="flex items-center gap-3">
        <span
          class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
          :class="q.claimed ? 'bg-sage' : q.done ? 'bg-apricot' : 'bg-sage-tint'"
        >
          <AppIcon
            v-if="q.claimed || q.done"
            name="check"
            :size="13"
            color="#fff"
            :stroke-width="3"
          />
        </span>

        <div class="min-w-0 flex-1">
          <div class="text-ink truncate text-sm font-semibold">
            {{ t(`quests.items.${q.id}`) }}
          </div>
          <div v-if="q.claimed && q.tier" class="text-xs font-bold" :class="TIER_CLASS[q.tier]">
            {{ t('quests.claimed', { tier: t(`quests.tier.${q.tier}`), xp: q.xp }) }}
          </div>
          <div v-else class="text-ink-soft text-xs">
            {{ t('quests.progress', { n: q.progress, target: q.target }) }}
          </div>
        </div>

        <button
          v-if="q.done && !q.claimed"
          type="button"
          data-test="quest-claim"
          class="bg-apricot cursor-pointer rounded-full border-none px-3.5 py-1.5 text-xs font-bold text-white shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--apricot)] focus-visible:ring-offset-2"
          :aria-label="t('quests.claimAria', { title: t(`quests.items.${q.id}`) })"
          @click="claim(q.id)"
        >
          {{ t('quests.claim') }}
        </button>
      </li>
    </ul>
  </div>
</template>
