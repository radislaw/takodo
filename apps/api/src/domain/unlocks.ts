/**
 * Level required to select each theme.
 * Accessibility themes (high-contrast) must stay at level 1 — never lock them.
 */
export const THEME_UNLOCK_LEVELS: Record<string, number> = {
  light: 1,
  dark: 1,
  silent: 1,
  'high-contrast': 1,
  lavender: 2,
  cloud: 2,
  eco: 3,
  ocean: 3,
  'lavender-dark': 4,
  amber: 4,
  cyberpunk: 5,
  amoled: 5,
}

export function themeUnlockLevel(theme: string): number {
  return THEME_UNLOCK_LEVELS[theme] ?? Number.POSITIVE_INFINITY
}

export function isThemeUnlocked(theme: string, level: number): boolean {
  return level >= themeUnlockLevel(theme)
}
