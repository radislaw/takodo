/**
 * Light/dark pairing for the global theme toggle.
 *
 * Most themes have a true light/dark counterpart that unlocks as a unit, so the
 * toggle always lands on an already-unlocked theme. The two "special" dark-only
 * themes (amoled, cyberpunk) are menu-only: toggling from them drops to `light`,
 * and from `light` the toggle goes to `dark` (never back to the special theme).
 */
export const THEME_PAIRS: Record<string, string> = {
  light: 'dark',
  dark: 'light',
  lavender: 'lavender-dark',
  'lavender-dark': 'lavender',
  eco: 'forest',
  forest: 'eco',
  ocean: 'ocean-dark',
  'ocean-dark': 'ocean',
  silent: 'silent-dark',
  'silent-dark': 'silent',
  amber: 'amber-dark',
  'amber-dark': 'amber',
  'high-contrast': 'high-contrast-dark',
  'high-contrast-dark': 'high-contrast',
  // Special dark-only themes toggle down to the base light theme.
  amoled: 'light',
  cyberpunk: 'light',
}

const DARK_THEMES = new Set([
  'dark',
  'forest',
  'lavender-dark',
  'ocean-dark',
  'silent-dark',
  'amber-dark',
  'high-contrast-dark',
  'amoled',
  'cyberpunk',
])

/** The theme the toggle switches to; unknown themes stay put. */
export function pairedTheme(theme: string): string {
  return THEME_PAIRS[theme] ?? theme
}

/** Whether the theme is dark — drives the sun/moon toggle icon. */
export function isDarkTheme(theme: string): boolean {
  return DARK_THEMES.has(theme)
}
