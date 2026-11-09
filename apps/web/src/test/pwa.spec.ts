import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const PUBLIC = resolve(dirname(fileURLToPath(import.meta.url)), '../../public')

type Manifest = {
  name?: string
  short_name?: string
  start_url?: string
  display?: string
  theme_color?: string
  background_color?: string
  icons?: Array<{ src: string; sizes: string; type: string; purpose?: string }>
}

describe('manifest.webmanifest', () => {
  let manifest: Manifest

  it('exists and parses as JSON', () => {
    const raw = readFileSync(`${PUBLIC}/manifest.webmanifest`, 'utf-8')
    manifest = JSON.parse(raw) as Manifest
    expect(manifest).toBeTruthy()
  })

  it('has name and short_name', () => {
    manifest = JSON.parse(readFileSync(`${PUBLIC}/manifest.webmanifest`, 'utf-8')) as Manifest
    expect(typeof manifest.name).toBe('string')
    expect(manifest.name!.length).toBeGreaterThan(0)
    expect(typeof manifest.short_name).toBe('string')
  })

  it('start_url points at today (relative, so it works under a subpath)', () => {
    manifest = JSON.parse(readFileSync(`${PUBLIC}/manifest.webmanifest`, 'utf-8')) as Manifest
    expect(manifest.start_url).toBe('today')
  })

  it('display is standalone', () => {
    manifest = JSON.parse(readFileSync(`${PUBLIC}/manifest.webmanifest`, 'utf-8')) as Manifest
    expect(manifest.display).toBe('standalone')
  })

  it('has theme_color and background_color', () => {
    manifest = JSON.parse(readFileSync(`${PUBLIC}/manifest.webmanifest`, 'utf-8')) as Manifest
    expect(manifest.theme_color).toMatch(/^#/)
    expect(manifest.background_color).toMatch(/^#/)
  })

  it('has at least one icon', () => {
    manifest = JSON.parse(readFileSync(`${PUBLIC}/manifest.webmanifest`, 'utf-8')) as Manifest
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons!.length).toBeGreaterThanOrEqual(1)
  })

  it('icon src exists in public dir', () => {
    manifest = JSON.parse(readFileSync(`${PUBLIC}/manifest.webmanifest`, 'utf-8')) as Manifest
    for (const icon of manifest.icons!) {
      const iconPath = resolve(PUBLIC, icon.src.replace(/^\//, ''))
      expect(existsSync(iconPath), `icon not found: ${icon.src}`).toBe(true)
    }
  })
})

describe('sw.js', () => {
  let sw: string

  it('exists', () => {
    sw = readFileSync(`${PUBLIC}/sw.js`, 'utf-8')
    expect(sw.length).toBeGreaterThan(0)
  })

  it('handles install event', () => {
    sw = readFileSync(`${PUBLIC}/sw.js`, 'utf-8')
    expect(sw).toContain('install')
  })

  it('handles activate event', () => {
    sw = readFileSync(`${PUBLIC}/sw.js`, 'utf-8')
    expect(sw).toContain('activate')
  })

  it('handles fetch event', () => {
    sw = readFileSync(`${PUBLIC}/sw.js`, 'utf-8')
    expect(sw).toContain('fetch')
  })

  it('skips cross-origin requests', () => {
    sw = readFileSync(`${PUBLIC}/sw.js`, 'utf-8')
    expect(sw).toContain('origin')
  })

  it('has SPA navigation fallback to the scope root', () => {
    sw = readFileSync(`${PUBLIC}/sw.js`, 'utf-8')
    expect(sw).toContain('self.registration.scope')
    expect(sw).toContain('caches.match(SCOPE)')
    expect(sw).toContain('navigate')
  })

  it('clones response before caching to avoid body-used error', () => {
    sw = readFileSync(`${PUBLIC}/sw.js`, 'utf-8')
    // clone() must be called on a local variable, not passed directly to caches.put
    expect(sw).toMatch(/const \w+ = res\.clone\(\)/)
  })

  it('bounds the runtime cache so old hashed assets are evicted', () => {
    sw = readFileSync(`${PUBLIC}/sw.js`, 'utf-8')
    // The cache name never rotates between deploys, so without an entry cap
    // every deploy's hashed assets accumulate in CacheStorage forever.
    expect(sw).toContain('MAX_ASSET_ENTRIES')
    expect(sw).toMatch(/\.delete\(/)
  })

  it('extends the fetch event lifetime for cache writes', () => {
    sw = readFileSync(`${PUBLIC}/sw.js`, 'utf-8')
    expect(sw).toMatch(/e\.waitUntil\(/)
  })
})

describe('index.html', () => {
  let html: string

  it('links the manifest', () => {
    html = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), '../../index.html'),
      'utf-8',
    )
    expect(html).toContain('manifest.webmanifest')
  })

  it('registers the service worker', () => {
    html = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), '../../index.html'),
      'utf-8',
    )
    expect(html).toContain('serviceWorker')
    expect(html).toContain('sw.js')
  })

  it('has theme-color meta', () => {
    html = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), '../../index.html'),
      'utf-8',
    )
    expect(html).toContain('theme-color')
  })
})
