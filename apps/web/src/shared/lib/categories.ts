export const CATEGORIES = ['home', 'health', 'work', 'self'] as const

export type Category = (typeof CATEGORIES)[number]

export const CAT_COLORS: Record<string, string> = {
  home: 'var(--cat-sage)',
  health: 'var(--cat-apricot)',
  work: 'var(--cat-blue)',
  self: 'var(--cat-mauve)',
}
