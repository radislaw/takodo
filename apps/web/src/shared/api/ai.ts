import { useQuery, useQueryCache } from '@pinia/colada'
import { toValue } from 'vue'
import type { Ref } from 'vue'
import { apiClient } from '@/api/client'
import { useAppMutation } from '@/shared/api/useMutationHelper'
import { useCacheInvalidate } from './cache-deps'
import { todayDate } from './daily'

/** The user's conversations, newest first. */
export function useConversations() {
  return useQuery({
    key: () => ['ai', 'conversations'],
    query: async () => {
      const { data } = await apiClient.GET('/ai/conversations')
      if (!data) throw new Error('Failed to load conversations')
      return data
    },
  })
}

/** One conversation with its full message history. Disabled until an id exists. */
export function useConversation(id: Ref<string | undefined> | string | undefined) {
  return useQuery({
    key: () => ['ai', 'conversation', toValue(id) ?? 'none'],
    enabled: () => Boolean(toValue(id)),
    query: async () => {
      const { data, error } = await apiClient.GET('/ai/conversations/{id}', {
        params: { path: { id: toValue(id)! } },
      })
      if (error) throw new Error('Conversation not found')
      return data!
    },
  })
}

export function useCreateConversation() {
  const queryCache = useQueryCache()
  return useAppMutation({
    mutation: async () => {
      const { data } = await apiClient.POST('/ai/conversations')
      if (!data) throw new Error('Failed to create conversation')
      return data
    },
    onSettled: () => queryCache.invalidateQueries({ key: ['ai', 'conversations'], exact: true }),
  })
}

/**
 * Send a user message; the agent acts autonomously and replies. On settle we
 * refresh the conversation AND every cache the agent's tools may have changed
 * (tasks / today / frequent) — that live sync is the transparency net.
 */
export function useSendMessage() {
  const inv = useCacheInvalidate()
  const queryCache = useQueryCache()
  return useAppMutation({
    mutation: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const { data, error } = await apiClient.POST('/ai/conversations/{id}/messages', {
        params: { path: { id: conversationId } },
        body: { content, today: todayDate() },
      })
      if (error) throw new Error(error.message)
      return data!
    },
    onSettled: (_data, _err, vars) => {
      queryCache.invalidateQueries({
        key: ['ai', 'conversation', vars.conversationId],
        exact: true,
      })
      inv.agentActions()
    },
  })
}
