/**
 * Theme unlock rules — the server is the source of truth (PATCH /me rejects
 * locked themes with 403). Mirrored by apps/web/src/shared/lib/unlocks.ts.
 *
 * Gating model:
 * - BASE_THEMES are always available (light + the accessibility high-contrast).
 * - FIRST_TASK_THEMES (dark + high-contrast-dark) unlock once the first task is
 *   completed — alongside the light/dark toggle. The dopamine hook.
 * - everything else unlocks by reaching a level (THEME_UNLOCK_LEVELS).
 * Accessibility themes (high-contrast, high-contrast-dark) must never be locked.
 */
export const BASE_THEMES = ['light', 'high-contrast'] as const
export const FIRST_TASK_THEMES = ['dark', 'high-contrast-dark'] as const

export const THEME_UNLOCK_LEVELS: Record<string, number> = {
  lavender: 2,
  'lavender-dark': 2,
  eco: 3,
  forest: 3,
  ocean: 4,
  'ocean-dark': 4,
  silent: 5,
  'silent-dark': 5,
  amber: 8,
  'amber-dark': 8,
  amoled: 15,
  cyberpunk: 50,
}

/** Levels that grant a new theme — for "N levels until next gift" messaging. */
export const GIFT_LEVELS = [2, 3, 4, 5, 8, 15, 50] as const

export interface UnlockState {
  level: number
  firstTaskDone: boolean
}

export function isBaseTheme(theme: string): boolean {
  return (BASE_THEMES as readonly string[]).includes(theme)
}

export function isFirstTaskTheme(theme: string): boolean {
  return (FIRST_TASK_THEMES as readonly string[]).includes(theme)
}

/** Level the theme unlocks at. Base + first-task themes resolve to 1; unknown → ∞. */
export function themeUnlockLevel(theme: string): number {
  if (isBaseTheme(theme) || isFirstTaskTheme(theme)) return 1
  return THEME_UNLOCK_LEVELS[theme] ?? Number.POSITIVE_INFINITY
}

export function isThemeUnlocked(theme: string, state: UnlockState): boolean {
  if (isBaseTheme(theme)) return true
  if (isFirstTaskTheme(theme)) return state.firstTaskDone
  return state.level >= (THEME_UNLOCK_LEVELS[theme] ?? Number.POSITIVE_INFINITY)
}

/** The next level that grants a gift, or null once every gift is unlocked. */
export function nextGiftLevel(level: number): number | null {
  for (const g of GIFT_LEVELS) if (g > level) return g
  return null
}
