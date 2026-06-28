<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppActionSheet, AppIcon, AppScreenHeader } from '@/shared/ui'
import {
  useConversations,
  useConversation,
  useCreateConversation,
  useDeleteConversation,
  useDeleteTask,
  useSendMessage,
} from '@/shared/api'

const { t } = useI18n({ useScope: 'global' })

const { data: conversations } = useConversations()
const { mutateAsync: createConversation } = useCreateConversation()
const { mutateAsync: deleteConversation } = useDeleteConversation()
const { mutateAsync: deleteTask } = useDeleteTask()
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
const sendFailed = ref(false)
const showHistory = ref(false)
const pendingDeleteId = ref<string | null>(null)
// The agent never deletes; it proposes (request_delete action). The user confirms
// here, and only then do we call the real DELETE /tasks/{id}.
const pendingDeleteTask = ref<{ id: string; title?: string } | null>(null)

const scrollEl = ref<HTMLElement | null>(null)
function scrollToBottom() {
  void nextTick(() => {
    const el = scrollEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}
watch([messages, pendingText, sendFailed], scrollToBottom, { deep: true })

async function dispatch(content: string) {
  if (!activeId.value || isSending.value) return
  pendingText.value = content
  sendFailed.value = false
  isSending.value = true
  try {
    await sendMessage({ conversationId: activeId.value, content })
    pendingText.value = null
  } catch {
    // Keep the failed text on screen so the user can retry it.
    sendFailed.value = true
  } finally {
    isSending.value = false
  }
}

function send() {
  const content = draft.value.trim()
  // Guard before clearing the draft, so a click before the conversation is
  // ready (activeId still loading) keeps the text instead of swallowing it.
  if (!content || !activeId.value || isSending.value) return
  draft.value = ''
  void dispatch(content)
}

function retry() {
  if (pendingText.value) void dispatch(pendingText.value)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

async function newChat() {
  showHistory.value = false
  const conv = await createConversation()
  activeId.value = conv.id
  pendingText.value = null
  sendFailed.value = false
}

function selectConversation(id: string) {
  showHistory.value = false
  if (id === activeId.value) return
  activeId.value = id
  pendingText.value = null
  sendFailed.value = false
}

async function confirmDelete() {
  const id = pendingDeleteId.value
  if (!id) return
  pendingDeleteId.value = null
  await deleteConversation(id)
  if (id === activeId.value) {
    // Drop the active id → the bootstrap watcher re-picks the newest or opens fresh.
    activeId.value = undefined
    pendingText.value = null
    sendFailed.value = false
  }
}

// Resend the last user turn. Covers the common open-model case where the
// request succeeds (200) but the agent apologises about an internal failure —
// the transport never errored, so the catch-based retry below won't show.
const lastUserContent = computed(
  () => [...messages.value].reverse().find((m) => m.role === 'user')?.content ?? '',
)
const canRegenerate = computed(
  () =>
    !isSending.value &&
    !sendFailed.value &&
    !pendingText.value &&
    Boolean(activeId.value) &&
    Boolean(lastUserContent.value) &&
    // After a reply (regenerate) or after an unanswered user turn (orphaned
    // when the previous request died mid-flight).
    messages.value.length > 0,
)
function regenerate() {
  if (lastUserContent.value) void dispatch(lastUserContent.value)
}

async function confirmDeleteTask() {
  const target = pendingDeleteTask.value
  if (!target) return
  pendingDeleteTask.value = null
  await deleteTask(target.id)
}

const examples = computed(() => [t('assistant.example1'), t('assistant.example2')])
function useExample(text: string) {
  draft.value = text
}
</script>

<template>
  <div class="surface-app relative flex h-full flex-col">
    <AppScreenHeader :title="t('assistant.title')" :subtitle="t('assistant.hint')">
      <template #actions>
        <button
          type="button"
          :aria-label="t('assistant.history')"
          class="text-ink-soft hover:text-ink flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
          @click="showHistory = true"
        >
          <AppIcon name="layers" :size="20" />
        </button>
        <button
          type="button"
          :aria-label="t('assistant.newChat')"
          class="text-ink-soft hover:text-ink flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
          @click="newChat"
        >
          <AppIcon name="plus" :size="22" />
        </button>
      </template>
    </AppScreenHeader>

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
                <template v-for="(a, i) in m.actions" :key="i">
                  <!-- The agent only proposes a delete — the user confirms it here. -->
                  <button
                    v-if="a.kind === 'request_delete'"
                    type="button"
                    class="bg-softrose-tint text-softrose hover:bg-softrose-tint/70 inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors"
                    @click="pendingDeleteTask = { id: a.taskId!, title: a.title }"
                  >
                    <AppIcon name="trash" :size="12" :stroke-width="2.5" />
                    {{
                      a.title
                        ? t('assistant.action.request_delete') + ' · ' + a.title
                        : t('assistant.action.request_delete')
                    }}
                  </button>
                  <span
                    v-else
                    class="bg-sage-tint text-sage-deep inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                  >
                    <AppIcon name="check" :size="12" :stroke-width="2.5" />
                    {{
                      a.title
                        ? t('assistant.action.' + a.kind) + ' · ' + a.title
                        : t('assistant.action.' + a.kind)
                    }}
                  </span>
                </template>
              </div>
            </div>
          </div>
        </template>

        <!-- Optimistic just-sent user message (stays visible if it failed, for retry) -->
        <div v-if="pendingText" class="flex justify-end">
          <div
            :class="[
              'font-body max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
              sendFailed ? 'bg-sage-deep/60 text-cream' : 'bg-sage-deep text-cream',
            ]"
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

        <!-- Error + retry -->
        <div v-if="sendFailed" class="flex justify-start">
          <div
            class="border-line font-body text-ink-soft flex flex-col items-start gap-2 rounded-2xl border bg-rose-50 px-4 py-2.5 text-sm shadow-sm dark:bg-rose-950/30"
          >
            <span>{{ t('assistant.errorTitle') }}</span>
            <button
              type="button"
              class="bg-sage-deep text-cream inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              @click="retry"
            >
              <AppIcon name="rotateCcw" :size="14" :stroke-width="2.4" />
              {{ t('assistant.retry') }}
            </button>
          </div>
        </div>

        <!-- Regenerate the last answer (always available after a reply) -->
        <div v-if="canRegenerate" class="flex justify-start">
          <button
            type="button"
            class="text-ink-soft hover:text-ink border-line font-body inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
            @click="regenerate"
          >
            <AppIcon name="repeat" :size="14" :stroke-width="2.4" />
            {{ t('assistant.retry') }}
          </button>
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

    <!-- History drawer -->
    <Transition name="fade">
      <div
        v-if="showHistory"
        class="absolute inset-0 z-20 bg-black/30"
        @click="showHistory = false"
      />
    </Transition>
    <Transition name="slide">
      <aside
        v-if="showHistory"
        class="surface-card border-line absolute inset-y-0 right-0 z-30 flex w-80 max-w-[85%] flex-col border-l shadow-xl"
      >
        <div class="border-line flex items-center justify-between border-b px-4 py-4">
          <h2 class="font-display text-ink text-lg font-extrabold">{{ t('assistant.history') }}</h2>
          <button
            type="button"
            :aria-label="t('a11y.close')"
            class="text-ink-soft hover:text-ink flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
            @click="showHistory = false"
          >
            <AppIcon name="x" :size="20" />
          </button>
        </div>

        <button
          type="button"
          class="border-line text-sage-deep font-body hover:bg-sage-tint/50 flex cursor-pointer items-center gap-2 border-b px-4 py-3 text-sm font-semibold"
          @click="newChat"
        >
          <AppIcon name="plus" :size="18" :stroke-width="2.4" />
          {{ t('assistant.newChat') }}
        </button>

        <div class="flex-1 overflow-y-auto">
          <p
            v-if="!conversations || conversations.length === 0"
            class="text-ink-faint font-body px-4 py-6 text-center text-sm"
          >
            {{ t('assistant.noHistory') }}
          </p>
          <ul v-else>
            <li
              v-for="c in conversations"
              :key="c.id"
              :class="[
                'border-line flex items-center gap-2 border-b px-3 py-2.5',
                c.id === activeId ? 'bg-sage-tint/40' : '',
              ]"
            >
              <button
                type="button"
                class="font-body text-ink min-w-0 flex-1 cursor-pointer truncate text-left text-sm"
                @click="selectConversation(c.id)"
              >
                {{ c.title || t('assistant.untitled') }}
              </button>
              <button
                type="button"
                :aria-label="t('assistant.delete')"
                class="text-ink-faint flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full hover:text-rose-500"
                @click="pendingDeleteId = c.id"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </Transition>

    <!-- Delete confirmation -->
    <AppActionSheet
      :open="pendingDeleteId !== null"
      :title="t('assistant.confirmDelete.title')"
      :subtitle="t('assistant.confirmDelete.subtitle')"
      @close="pendingDeleteId = null"
    >
      <div class="flex flex-col gap-2 pt-2">
        <button
          type="button"
          class="font-body text-softrose bg-softrose-tint flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-bold transition-colors"
          @click="confirmDelete"
        >
          {{ t('assistant.confirmDelete.confirm') }}
        </button>
        <button
          type="button"
          class="font-body text-ink-soft flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-semibold transition-colors"
          @click="pendingDeleteId = null"
        >
          {{ t('assistant.confirmDelete.cancel') }}
        </button>
      </div>
    </AppActionSheet>

    <!-- Task delete confirmation (proposed by the agent) -->
    <AppActionSheet
      :open="pendingDeleteTask !== null"
      :title="t('assistant.confirmDeleteTask.title')"
      :subtitle="pendingDeleteTask?.title ?? t('assistant.confirmDeleteTask.subtitle')"
      @close="pendingDeleteTask = null"
    >
      <div class="flex flex-col gap-2 pt-2">
        <button
          type="button"
          class="font-body text-softrose bg-softrose-tint flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-bold transition-colors"
          @click="confirmDeleteTask"
        >
          {{ t('assistant.confirmDeleteTask.confirm') }}
        </button>
        <button
          type="button"
          class="font-body text-ink-soft flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-semibold transition-colors"
          @click="pendingDeleteTask = null"
        >
          {{ t('assistant.confirmDeleteTask.cancel') }}
        </button>
      </div>
    </AppActionSheet>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .slide-enter-active,
  .slide-leave-active {
    transition: none;
  }
}
</style>
