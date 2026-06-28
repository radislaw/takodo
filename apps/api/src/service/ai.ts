import type { FastifyRequest, FastifyReply } from 'fastify'
import { Prisma, type PrismaClient, type Message } from '@prisma/client'
import { toDateStr, resolveClientDate } from '../domain/date.js'
import type { AgentAction, AgentMessage } from '../ai/types.js'
import type { AgentRunner } from '../ai/runner.js'
import type { GetUserId } from '../auth/guard.js'

interface MessageResponse {
  id: string
  role: string
  content: string
  actions?: AgentAction[]
  createdAt: Date
}

function toMessageResponse(m: Message): MessageResponse {
  const actions = (m.actions as AgentAction[] | null) ?? undefined
  return { id: m.id, role: m.role, content: m.content, actions, createdAt: m.createdAt }
}

/**
 * Assistant handlers. Conversations are user-scoped; `sendMessage` persists the
 * user turn, runs the autonomous agent, persists the assistant turn (with the
 * actions it took), and returns both. When no LLM is configured the runner is
 * null → `sendMessage` is 503 but conversations stay browsable.
 */
export function buildAIHandlers(
  prisma: PrismaClient,
  getUserId: GetUserId,
  runner: AgentRunner | null,
) {
  return {
    async Assistant_createConversation(req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId(req)
      const c = await prisma.conversation.create({ data: { userId } })
      return { id: c.id, title: c.title ?? undefined, createdAt: c.createdAt }
    },

    async Assistant_listConversations(req: FastifyRequest, _reply: FastifyReply) {
      const userId = await getUserId(req)
      const list = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      return list.map((c) => ({ id: c.id, title: c.title ?? undefined, createdAt: c.createdAt }))
    },

    async Assistant_getConversation(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      const c = await prisma.conversation.findUnique({
        where: { id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
      if (!c || c.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Conversation not found' })
      }
      return {
        id: c.id,
        title: c.title ?? undefined,
        createdAt: c.createdAt,
        messages: c.messages.map(toMessageResponse),
      }
    },

    async Assistant_sendMessage(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId(req)
      const { id } = req.params as { id: string }
      const { content, today: clientToday } = req.body as { content: string; today?: string }

      const conv = await prisma.conversation.findUnique({
        where: { id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
      if (!conv || conv.userId !== userId) {
        return reply.status(404).send({ code: 'not_found', message: 'Conversation not found' })
      }
      if (!runner) {
        return reply
          .status(503)
          .send({ code: 'ai_unavailable', message: 'AI assistant is not configured' })
      }

      const today = resolveClientDate(clientToday) ?? toDateStr(new Date())
      // Cap replayed history to keep each request well under free-tier token limits.
      const HISTORY_LIMIT = 8
      const history: AgentMessage[] = conv.messages.slice(-HISTORY_LIMIT).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))

      await prisma.message.create({ data: { conversationId: id, role: 'user', content } })

      let result
      try {
        result = await runner.run({ ctx: { userId, today }, history, userMessage: content })
      } catch (err) {
        req.log.error({ err }, 'AI agent run failed')
        return reply.status(502).send({ code: 'ai_error', message: 'AI provider request failed' })
      }

      const assistant = await prisma.message.create({
        data: {
          conversationId: id,
          role: 'assistant',
          content: result.text,
          actions: result.actions as unknown as Prisma.InputJsonValue,
        },
      })

      return { assistantMessage: toMessageResponse(assistant), actions: result.actions }
    },
  }
}
