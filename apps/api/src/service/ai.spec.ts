import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient, Conversation, Message } from '@prisma/client'
import { buildApp } from '../app.js'
import type { AgentRunner } from '../ai/runner.js'

const prisma = mockDeep<PrismaClient>()
const getUserId = vi.fn().mockResolvedValue('user-1')
const runner: AgentRunner = { run: vi.fn() }

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'conv-1',
    userId: 'user-1',
    title: null,
    createdAt: new Date('2024-01-15T00:00:00.000Z'),
    ...overrides,
  }
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    role: 'assistant',
    content: 'Готово!',
    actions: null,
    createdAt: new Date('2024-01-15T00:00:01.000Z'),
    ...overrides,
  }
}

describe('Assistant routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    mockReset(prisma)
    getUserId.mockResolvedValue('user-1')
    vi.mocked(runner.run).mockReset()
    app = buildApp({ prisma, getUserId, agentRunner: runner })
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST /ai/conversations', () => {
    it('creates a conversation', async () => {
      prisma.conversation.create.mockResolvedValue(makeConversation())
      const res = await app.inject({ method: 'POST', url: '/ai/conversations' })
      expect(res.statusCode).toBe(200)
      expect((res.json() as Record<string, unknown>).id).toBe('conv-1')
    })
  })

  describe('GET /ai/conversations', () => {
    it('lists conversations', async () => {
      prisma.conversation.findMany.mockResolvedValue([makeConversation()])
      const res = await app.inject({ method: 'GET', url: '/ai/conversations' })
      expect(res.statusCode).toBe(200)
      expect(res.json() as unknown[]).toHaveLength(1)
    })
  })

  describe('GET /ai/conversations/:id', () => {
    it('returns the conversation with messages', async () => {
      prisma.conversation.findUnique.mockResolvedValue({
        ...makeConversation(),
        messages: [makeMessage({ role: 'user', content: 'привет' }), makeMessage()],
      } as Parameters<typeof prisma.conversation.findUnique.mockResolvedValue>[0])
      const res = await app.inject({ method: 'GET', url: '/ai/conversations/conv-1' })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { messages: unknown[] }
      expect(body.messages).toHaveLength(2)
    })

    it('returns 404 when the conversation belongs to another user', async () => {
      prisma.conversation.findUnique.mockResolvedValue({
        ...makeConversation({ userId: 'other' }),
        messages: [],
      } as Parameters<typeof prisma.conversation.findUnique.mockResolvedValue>[0])
      const res = await app.inject({ method: 'GET', url: '/ai/conversations/conv-1' })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /ai/conversations/:id/messages', () => {
    it('runs the agent, persists both turns, returns reply + actions', async () => {
      prisma.conversation.findUnique.mockResolvedValue({
        ...makeConversation(),
        messages: [],
      } as Parameters<typeof prisma.conversation.findUnique.mockResolvedValue>[0])
      vi.mocked(runner.run).mockResolvedValue({
        text: 'Разбил на 3 шага.',
        actions: [{ kind: 'create_task', taskId: 't1', title: 'Шаг 1' }],
      })
      prisma.message.create
        .mockResolvedValueOnce(makeMessage({ id: 'u1', role: 'user', content: 'разбей задачу' }))
        .mockResolvedValueOnce(
          makeMessage({
            id: 'a1',
            role: 'assistant',
            content: 'Разбил на 3 шага.',
            actions: [
              { kind: 'create_task', taskId: 't1', title: 'Шаг 1' },
            ] as unknown as Message['actions'],
          }),
        )

      const res = await app.inject({
        method: 'POST',
        url: '/ai/conversations/conv-1/messages',
        payload: { content: 'разбей задачу' },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { assistantMessage: { content: string }; actions: unknown[] }
      expect(body.assistantMessage.content).toBe('Разбил на 3 шага.')
      expect(body.actions).toHaveLength(1)
      expect(prisma.message.create).toHaveBeenCalledTimes(2)
      expect(runner.run).toHaveBeenCalledOnce()
    })

    it('returns 404 when conversation not found', async () => {
      prisma.conversation.findUnique.mockResolvedValue(null)
      const res = await app.inject({
        method: 'POST',
        url: '/ai/conversations/missing/messages',
        payload: { content: 'привет' },
      })
      expect(res.statusCode).toBe(404)
      expect(runner.run).not.toHaveBeenCalled()
    })

    it('rejects content over 4000 chars (contract maxLength)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/ai/conversations/conv-1/messages',
        payload: { content: 'x'.repeat(4001) },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 503 when no AI runner is configured', async () => {
      const noAiApp = buildApp({ prisma, getUserId, agentRunner: null })
      await noAiApp.ready()
      prisma.conversation.findUnique.mockResolvedValue({
        ...makeConversation(),
        messages: [],
      } as Parameters<typeof prisma.conversation.findUnique.mockResolvedValue>[0])
      const res = await noAiApp.inject({
        method: 'POST',
        url: '/ai/conversations/conv-1/messages',
        payload: { content: 'привет' },
      })
      expect(res.statusCode).toBe(503)
      await noAiApp.close()
    })
  })
})
