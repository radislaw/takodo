<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppScreenHeader } from '@/shared/ui'
import {
  useConversations,
  useConversation,
  useCreateConversation,
  useSendMessage,
} from '@/shared/api'

const { t } = useI18n({ useScope: 'global' })

const { data: conversations } = useConversations()
const { mutateAsync: createConversation } = useCreateConversation()
const { mutateAsync: sendMessage } = useSendMessage()

const activeId = ref<string | undefined>()
let bootstrapping = false

// Pick the latest conversation on load, or open a fresh one if there are none.
watch(
  conversations,
  async (list) => {
    if (activeId.value || bootstrapping || !list) return
    if (list.length > 0) {
      activeId.value = list[0]!.id
      return
    }
    bootstrapping = true
    try {
      const conv = await createConversation()
      activeId.value = conv.id
    } finally {
      bootstrapping = false
    }
  },
  { immediate: true },
)

const { data: conversation } = useConversation(activeId)
const messages = computed(() => conversation.value?.messages ?? [])

const draft = ref('')
const pendingText = ref<string | null>(null)
const isSending = ref(false)

const scrollEl = ref<HTMLElement | null>(null)
function scrollToBottom() {
  void nextTick(() => {
    const el = scrollEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}
watch([messages, pendingText], scrollToBottom, { deep: true })

async function send() {
  const content = draft.value.trim()
  if (!content || !activeId.value || isSending.value) return
  draft.value = ''
  pendingText.value = content
  isSending.value = true
  try {
    await sendMessage({ conversationId: activeId.value, content })
  } finally {
    isSending.value = false
    pendingText.value = null
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void send()
  }
}

const examples = computed(() => [t('assistant.example1'), t('assistant.example2')])
function useExample(text: string) {
  draft.value = text
}
</script>

<template>
  <div class="surface-app flex h-full flex-col">
    <AppScreenHeader :title="t('assistant.title')" :subtitle="t('assistant.hint')" />

    <div ref="scrollEl" class="flex-1 overflow-y-auto px-4 pt-5 pb-4 md:px-8">
      <div class="mx-auto flex w-full max-w-xl flex-col gap-3">
        <!-- Empty state: greeting + example prompts -->
        <div v-if="messages.length === 0 && !pendingText" class="py-8 text-center">
          <div
            class="bg-sage-tint mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          >
            <AppIcon name="sparkles" :size="26" class="text-sage-deep" />
          </div>
          <p class="font-display text-ink text-lg font-extrabold">
            {{ t('assistant.emptyTitle') }}
          </p>
          <p class="text-ink-soft font-body mx-auto mt-1 max-w-xs text-sm">
            {{ t('assistant.emptyHint') }}
          </p>
          <div class="mt-5 flex flex-col items-stretch gap-2">
            <button
              v-for="(ex, i) in examples"
              :key="i"
              type="button"
              class="surface-card border-line font-body text-ink-soft hover:text-ink cursor-pointer rounded-2xl border px-4 py-3 text-left text-sm shadow-sm"
              @click="useExample(ex)"
            >
              {{ ex }}
            </button>
          </div>
        </div>

        <!-- Conversation -->
        <template v-for="m in messages" :key="m.id">
          <div :class="m.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
            <div
              :class="[
                'font-body max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                m.role === 'user'
                  ? 'bg-sage-deep text-cream'
                  : 'surface-card border-line text-ink border shadow-sm',
              ]"
            >
              {{ m.content }}
              <div v-if="m.actions && m.actions.length" class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="(a, i) in m.actions"
                  :key="i"
                  class="bg-sage-tint text-sage-deep inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                >
                  <AppIcon name="check" :size="12" :stroke-width="2.5" />
                  {{
                    a.title
                      ? t('assistant.action.' + a.kind) + ' · ' + a.title
                      : t('assistant.action.' + a.kind)
                  }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- Optimistic just-sent user message -->
        <div v-if="pendingText" class="flex justify-end">
          <div
            class="bg-sage-deep text-cream font-body max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
          >
            {{ pendingText }}
          </div>
        </div>

        <!-- Agent working indicator -->
        <div v-if="isSending" class="flex justify-start">
          <div
            class="surface-card border-line text-ink-soft font-body flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm shadow-sm"
          >
            <AppIcon name="sparkles" :size="16" class="text-sage-deep animate-pulse" />
            {{ t('assistant.working') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Composer -->
    <div class="surface-card border-line pb-nav border-t px-4 pt-3 md:px-8">
      <div class="mx-auto flex w-full max-w-xl items-end gap-2">
        <textarea
          v-model="draft"
          :placeholder="t('assistant.placeholder')"
          rows="1"
          :aria-label="t('assistant.title')"
          class="font-body text-ink bg-cream-deep border-line placeholder:text-ink-faint focus:border-sage focus:shadow-ring max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border-[1.5px] px-4 py-3 text-sm outline-none"
          @keydown="onKeydown"
        />
        <button
          type="button"
          :disabled="!draft.trim() || isSending"
          :aria-label="t('assistant.send')"
          class="bg-sage-deep text-cream flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
          @click="send"
        >
          <AppIcon name="arrowR" :size="20" :stroke-width="2.4" />
        </button>
      </div>
    </div>
  </div>
</template>
