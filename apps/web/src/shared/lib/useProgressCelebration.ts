import { ref, watch } from 'vue'
import { useRewards } from '@/shared/api'
import { GIFT_LEVELS, THEME_UNLOCK_LEVELS, FIRST_TASK_THEMES, nextGiftLevel } from './unlocks'

/**
 * Progress celebration: a gift modal + confetti fired when the first task is
 * completed (unlocks dark themes + the toggle) and when a level-up actually
 * unlocks a theme. A plain level-up with nothing to unlock does NOT open the
 * modal — the per-completion reward burst already celebrates it, and stacking a
 * second full-screen interrupt on top is noise.
 *
 * The reward summary has no "level-up" signal, so we detect it client-side by
 * comparing the latest rewards against a localStorage baseline. The baseline is
 * captured silently on first observation, so existing users are never greeted
 * with a celebration for progress they already had.
 */
export interface ProgressState {
  level: number
  firstTaskDone: boolean
}

export interface CelebrationEvent {
  kind: 'first-task' | 'level-up'
  /** Level to display / the level a gift theme unlocked at. */
  level: number
  /** Theme ids unlocked at this step (named in the modal); may be empty. */
  themes: string[]
  /** Next level that grants a gift, or null once everything is unlocked. */
  nextGift: number | null
}

/** Level-gated themes that unlock exactly at `level`. */
export function themesAtLevel(level: number): string[] {
  return Object.entries(THEME_UNLOCK_LEVELS)
    .filter(([, lvl]) => lvl === level)
    .map(([theme]) => theme)
}

/**
 * Pure planner: what to celebrate moving from `prev` → `next`.
 * Returns [] when there is no baseline yet (first observation is silent).
 */
export function planCelebrations(
  prev: ProgressState | null,
  next: ProgressState,
): CelebrationEvent[] {
  if (!prev) return []
  const events: CelebrationEvent[] = []

  if (next.firstTaskDone && !prev.firstTaskDone) {
    events.push({
      kind: 'first-task',
      level: next.level,
      themes: [...FIRST_TASK_THEMES],
      nextGift: nextGiftLevel(next.level),
    })
  }

  if (next.level > prev.level) {
    // Only gift levels (theme unlocks) open the modal; plain level-ups are left
    // to the per-completion reward burst so we never stack two interrupts.
    const giftsCrossed = GIFT_LEVELS.filter((g) => g > prev.level && g <= next.level)
    for (const g of giftsCrossed) {
      events.push({
        kind: 'level-up',
        level: g,
        themes: themesAtLevel(g),
        nextGift: nextGiftLevel(g),
      })
    }
  }

  return events
}

const STORAGE_KEY = 'takodo:progress-baseline'

function readBaseline(): ProgressState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ProgressState
    if (typeof parsed.level === 'number' && typeof parsed.firstTaskDone === 'boolean') return parsed
    return null
  } catch {
    return null
  }
}

function writeBaseline(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage unavailable (private mode) — celebrations simply won't fire.
  }
}

// Module-level singleton state so the modal and the watcher share one queue.
const queue = ref<CelebrationEvent[]>([])
const current = ref<CelebrationEvent | null>(null)
let watcherAttached = false

function pump(): void {
  if (current.value === null && queue.value.length > 0) {
    current.value = queue.value.shift() ?? null
  }
}

export function dismissCelebration(): void {
  current.value = null
  pump()
}

export function useProgressCelebration() {
  if (!watcherAttached) {
    watcherAttached = true
    const { data } = useRewards()
    watch(
      data,
      (rewards) => {
        if (!rewards) return
        const next: ProgressState = {
          level: rewards.level,
          firstTaskDone: rewards.badges?.find((b) => b.id === 'first_step')?.earned ?? false,
        }
        const prev = readBaseline()
        const events = planCelebrations(prev, next)
        if (events.length > 0) queue.value.push(...events)
        writeBaseline(next)
        pump()
      },
      { immediate: true },
    )
  }
  return { current, dismiss: dismissCelebration }
}
