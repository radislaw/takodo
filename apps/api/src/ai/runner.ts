import type { PrismaClient } from '@prisma/client'
import { loadLLMConfig, createCompleteFn } from './client.js'
import { buildToolRegistry } from './tools.js'
import { runAgent, type AgentRunInput } from './agent.js'
import type { AgentRunResult } from './types.js'

/** A ready-to-run agent: one autonomous assistant turn. Injected into the AI
 *  handlers so tests can stub it and the app can skip it when no LLM key is set. */
export interface AgentRunner {
  run(input: AgentRunInput): Promise<AgentRunResult>
}

/**
 * Build the real runner from env (`LLM_*`). Returns `null` when no LLM key is
 * configured — the app still boots; `sendMessage` then replies 503 while the rest
 * of the assistant (browsing conversations) keeps working.
 */
export function createAgentRunner(prisma: PrismaClient): AgentRunner | null {
  let config
  try {
    config = loadLLMConfig()
  } catch {
    return null
  }
  const complete = createCompleteFn(config)
  const tools = buildToolRegistry()
  return {
    run: (input) => runAgent({ complete, model: config.model, prisma, tools }, input),
  }
}
