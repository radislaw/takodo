import { describe, it, expect } from 'vitest'
import { pairedTheme, isDarkTheme } from './themePairs'

describe('THEME_PAIRS', () => {
  it('pairs true light/dark counterparts symmetrically', () => {
    const symmetric: [string, string][] = [
      ['light', 'dark'],
      ['lavender', 'lavender-dark'],
      ['eco', 'forest'],
      ['ocean', 'ocean-dark'],
      ['silent', 'silent-dark'],
      ['amber', 'amber-dark'],
      ['high-contrast', 'high-contrast-dark'],
    ]
    for (const [a, b] of symmetric) {
      expect(pairedTheme(a)).toBe(b)
      expect(pairedTheme(b)).toBe(a)
    }
  })

  it('toggles special dark-only themes down to light', () => {
    expect(pairedTheme('amoled')).toBe('light')
    expect(pairedTheme('cyberpunk')).toBe('light')
  })
})

describe('pairedTheme', () => {
  it('keeps unknown themes unchanged', () => {
    expect(pairedTheme('nonexistent')).toBe('nonexistent')
  })
})

describe('isDarkTheme', () => {
  it('detects dark themes', () => {
    for (const t of [
      'dark',
      'forest',
      'lavender-dark',
      'ocean-dark',
      'silent-dark',
      'amber-dark',
      'high-contrast-dark',
      'amoled',
      'cyberpunk',
    ]) {
      expect(isDarkTheme(t)).toBe(true)
    }
  })

  it('detects light themes', () => {
    for (const t of ['light', 'lavender', 'eco', 'ocean', 'silent', 'amber', 'high-contrast']) {
      expect(isDarkTheme(t)).toBe(false)
    }
  })
})
