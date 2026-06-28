import type OpenAI from 'openai'

/** A structured record of one autonomous action the agent took, surfaced to the
 *  web as a localized "action chip". `kind` maps to an i18n label; `title`/`taskId`
 *  are optional data the chip can show or link to. */
export interface AgentAction {
  kind: string
  taskId?: string
  title?: string
}

/** A stored conversation turn (user or assistant text), replayed into the model. */
export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AgentRunResult {
  text: string
  actions: AgentAction[]
}

/** Per-request execution context handed to every tool. Scopes all data access. */
export interface ToolContext {
  userId: string
  /** Client's local day, `YYYY-MM-DD`. "Today" for daily-list tools. */
  today: string
}

/** Narrow seam over the OpenAI-compatible chat API — one non-streaming call.
 *  Injected so tests can supply a fake without constructing a real client. */
export type CompleteFn = (
  body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
) => Promise<OpenAI.Chat.Completions.ChatCompletion>
