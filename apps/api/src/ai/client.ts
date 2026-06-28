import OpenAI from 'openai'
import type { CompleteFn } from './types.js'

/**
 * LLM provider config. Provider-agnostic by design: the agent talks the
 * OpenAI-compatible Chat Completions dialect, so the default (Groq, free) swaps
 * to Gemini / OpenRouter / Anthropic by changing these three env vars only.
 */
export interface LLMConfig {
  apiKey: string
  baseURL: string
  model: string
}

const DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

/** Read LLM config from env. Throws if no key is set (fail fast at startup). */
export function loadLLMConfig(): LLMConfig {
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) throw new Error('LLM_API_KEY not configured')
  return {
    apiKey,
    baseURL: process.env.LLM_BASE_URL ?? DEFAULT_BASE_URL,
    model: process.env.LLM_MODEL ?? DEFAULT_MODEL,
  }
}

/** Build the injectable `complete` seam from config. */
export function createCompleteFn(config: LLMConfig): CompleteFn {
  const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL })
  return (body) => client.chat.completions.create(body)
}
