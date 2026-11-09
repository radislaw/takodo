<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/ui'
import { useSubmitFeedback, type FeedbackKind } from '@/shared/api'

withDefaults(defineProps<{ headless?: boolean }>(), { headless: false })

const { t } = useI18n({ useScope: 'global' })
const { mutateAsync: submitFeedback, isLoading } = useSubmitFeedback()

const KINDS: FeedbackKind[] = ['review', 'wish', 'support']

const kind = ref<FeedbackKind>('review')
const message = ref('')
const rating = ref(0)

const canSubmit = computed(() => message.value.trim().length > 0 && !isLoading.value)

async function submit() {
  if (!canSubmit.value) return
  try {
    await submitFeedback({
      kind: kind.value,
      message: message.value.trim(),
      ...(kind.value === 'review' && rating.value > 0 ? { rating: rating.value } : {}),
    })
    message.value = ''
    rating.value = 0
  } catch {
    // Error toast is surfaced by the composable's onError; keep the draft intact.
  }
}
</script>

<template>
  <div
    :class="headless ? '' : 'surface-card mt-5 rounded-2xl p-5 shadow-md'"
    data-test="feedback-section"
  >
    <div v-if="!headless" class="mb-4 flex items-center gap-3">
      <div
        class="bg-sage-tint text-sage-deep flex h-10 w-10 items-center justify-center rounded-[11px]"
      >
        <AppIcon name="heart" :size="20" />
      </div>
      <div>
        <div class="text-ink text-sm font-bold">{{ t('profile.feedback.label') }}</div>
        <div class="text-ink-soft text-xs">{{ t('profile.feedback.sub') }}</div>
      </div>
    </div>

    <!-- Kind selector -->
    <div class="mb-3 flex gap-2">
      <button
        v-for="k in KINDS"
        :key="k"
        type="button"
        :data-test="`feedback-kind-${k}`"
        class="flex-1 cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
        :class="
          kind === k ? 'border-sage bg-sage text-white' : 'border-line text-ink-soft hover:text-ink'
        "
        @click="kind = k"
      >
        {{ t(`profile.feedback.kinds.${k}`) }}
      </button>
    </div>

    <!-- Rating (reviews only) -->
    <div v-if="kind === 'review'" class="mb-3 flex items-center gap-2" data-test="feedback-rating">
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        :aria-label="t('profile.feedback.ratingStar', { n: star })"
        class="cursor-pointer transition-colors"
        :class="star <= rating ? 'text-reward' : 'text-ink-faint'"
        @click="rating = star"
      >
        <AppIcon name="star" :size="22" :fill="star <= rating ? 'currentColor' : 'none'" />
      </button>
    </div>

    <!-- Message -->
    <textarea
      v-model="message"
      data-test="feedback-message"
      rows="4"
      maxlength="5000"
      :placeholder="t('profile.feedback.messagePlaceholder')"
      class="border-line surface-app text-ink w-full resize-none rounded-xl border px-3 py-2.5 text-sm"
    />
    <div class="text-ink-faint mt-1 text-right text-xs" data-test="feedback-char-count">
      {{ t('profile.feedback.charCount', { n: message.length }) }}
    </div>

    <button
      type="button"
      data-test="feedback-submit"
      class="bg-sage mt-3 w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
      :disabled="!canSubmit"
      @click="submit"
    >
      {{ t('profile.feedback.submit') }}
    </button>
  </div>
</template>
