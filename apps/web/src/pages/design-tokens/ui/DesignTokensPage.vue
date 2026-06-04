<script setup lang="ts">
import TokenSwatch from './TokenSwatch.vue'

const surfaces = [
  { name: '--cream', cssVar: '--cream' },
  { name: '--cream-deep', cssVar: '--cream-deep' },
  { name: '--card', cssVar: '--card' },
]

const fills = [
  { name: '--accent-fill', cssVar: '--accent-fill' },
  { name: '--reward-fill', cssVar: '--reward-fill' },
]

const ink = [
  { name: '--ink', cssVar: '--ink' },
  { name: '--ink-soft', cssVar: '--ink-soft' },
  { name: '--ink-faint', cssVar: '--ink-faint' },
]

const sage = [
  { name: '--sage', cssVar: '--sage' },
  { name: '--sage-press', cssVar: '--sage-press' },
  { name: '--sage-deep', cssVar: '--sage-deep' },
  { name: '--sage-tint', cssVar: '--sage-tint' },
  { name: '--sage-tint-2', cssVar: '--sage-tint-2' },
]

const apricot = [
  { name: '--apricot', cssVar: '--apricot' },
  { name: '--apricot-press', cssVar: '--apricot-press' },
  { name: '--apricot-deep', cssVar: '--apricot-deep' },
  { name: '--apricot-tint', cssVar: '--apricot-tint' },
]

const semantic = [
  { name: '--done', cssVar: '--done' },
  { name: '--done-tint', cssVar: '--done-tint' },
  { name: '--gentle', cssVar: '--gentle' },
  { name: '--gentle-tint', cssVar: '--gentle-tint' },
  { name: '--softrose', cssVar: '--softrose' },
  { name: '--softrose-tint', cssVar: '--softrose-tint' },
]

const categories = [
  { name: '--cat-sage', cssVar: '--cat-sage' },
  { name: '--cat-apricot', cssVar: '--cat-apricot' },
  { name: '--cat-blue', cssVar: '--cat-blue' },
  { name: '--cat-clay', cssVar: '--cat-clay' },
  { name: '--cat-gold', cssVar: '--cat-gold' },
  { name: '--cat-mauve', cssVar: '--cat-mauve' },
]

const lines = [
  { name: '--line', cssVar: '--line' },
  { name: '--line-card', cssVar: '--line-card' },
  { name: '--line-strong', cssVar: '--line-strong' },
]

const shadows = [
  { name: '--shadow-sm', cssVar: '--shadow-sm' },
  { name: '--shadow-md', cssVar: '--shadow-md' },
  { name: '--shadow-lg', cssVar: '--shadow-lg' },
  { name: '--shadow-pop', cssVar: '--shadow-pop' },
  { name: '--ring', cssVar: '--ring' },
  { name: '--ring-apr', cssVar: '--ring-apr' },
]

const radii = [
  { name: '--r-xs (8px)', cssVar: '--r-xs' },
  { name: '--r-sm (12px)', cssVar: '--r-sm' },
  { name: '--r-md (16px)', cssVar: '--r-md' },
  { name: '--r-lg (20px)', cssVar: '--r-lg' },
  { name: '--r-xl (28px)', cssVar: '--r-xl' },
  { name: '--r-pill (999px)', cssVar: '--r-pill' },
]

const spacing = [
  { name: '--s-1 (4px)', cssVar: '--s-1' },
  { name: '--s-2 (8px)', cssVar: '--s-2' },
  { name: '--s-3 (12px)', cssVar: '--s-3' },
  { name: '--s-4 (16px)', cssVar: '--s-4' },
  { name: '--s-5 (20px)', cssVar: '--s-5' },
  { name: '--s-6 (24px)', cssVar: '--s-6' },
  { name: '--s-7 (32px)', cssVar: '--s-7' },
  { name: '--s-8 (40px)', cssVar: '--s-8' },
  { name: '--s-9 (48px)', cssVar: '--s-9' },
  { name: '--s-10 (64px)', cssVar: '--s-10' },
  { name: '--s-12 (80px)', cssVar: '--s-12' },
]

const typeClasses = [
  { name: '.ad-display', cls: 'ad-display' },
  { name: '.ad-h1', cls: 'ad-h1' },
  { name: '.ad-h2', cls: 'ad-h2' },
  { name: '.ad-h3', cls: 'ad-h3' },
  { name: '.ad-h4', cls: 'ad-h4' },
  { name: '.ad-body-lg', cls: 'ad-body-lg' },
  { name: '.ad-body', cls: 'ad-body' },
  { name: '.ad-sm', cls: 'ad-sm' },
  { name: '.ad-cap', cls: 'ad-cap' },
  { name: '.ad-overline', cls: 'ad-overline' },
]
</script>

<template>
  <div class="page surface-app">
    <header class="page-header surface-card">
      <h1 class="ad-h2">Design Tokens</h1>
      <p class="ad-sm">
        Switch theme:
        <code>document.documentElement.dataset.theme = 'dark'</code>
      </p>
    </header>

    <main class="page-content">
      <!-- Surfaces -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">Surfaces</h2>
        <p class="ad-sm section-note">
          Use <code>surface-app</code> / <code>surface-deep</code> /
          <code>surface-card</code> utilities (gradient-safe; cyberpunk uses radial/linear gradients
          here).
        </p>
        <div class="swatch-grid">
          <div v-for="t in surfaces" :key="t.name" class="token-swatch">
            <div
              class="swatch-box surface-preview"
              :class="`surface-${t.name.replace('--cream', 'deep').replace('--card', 'card')}`"
              :style="{
                background: `var(${t.cssVar})`,
                border: '1px solid var(--line)',
              }"
            />
            <code class="swatch-label">{{ t.name }}</code>
          </div>
        </div>
      </section>

      <!-- Fills -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">Fills (accent &amp; reward)</h2>
        <p class="ad-sm section-note">
          Use <code>fill-accent</code> / <code>fill-reward</code> utilities. May be gradients in
          some themes.
        </p>
        <div class="swatch-grid">
          <div v-for="t in fills" :key="t.name" class="token-swatch">
            <div
              class="swatch-box"
              :class="t.cssVar === '--accent-fill' ? 'fill-accent' : 'fill-reward'"
            />
            <code class="swatch-label">{{ t.name }}</code>
          </div>
        </div>
      </section>

      <!-- Ink -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">Ink (text)</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="t in ink"
            :key="t.name"
            :name="t.name"
            :css-var="t.cssVar"
            kind="color"
          />
        </div>
      </section>

      <!-- Sage accent -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">Sage (primary accent)</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="t in sage"
            :key="t.name"
            :name="t.name"
            :css-var="t.cssVar"
            kind="color"
          />
        </div>
      </section>

      <!-- Apricot reward -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">Apricot (reward)</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="t in apricot"
            :key="t.name"
            :name="t.name"
            :css-var="t.cssVar"
            kind="color"
          />
        </div>
      </section>

      <!-- Semantic -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">Semantic</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="t in semantic"
            :key="t.name"
            :name="t.name"
            :css-var="t.cssVar"
            kind="color"
          />
        </div>
      </section>

      <!-- Category dots -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">Category dots</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="t in categories"
            :key="t.name"
            :name="t.name"
            :css-var="t.cssVar"
            kind="color"
          />
        </div>
      </section>

      <!-- Lines -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">Lines &amp; edges</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="t in lines"
            :key="t.name"
            :name="t.name"
            :css-var="t.cssVar"
            kind="color"
          />
        </div>
      </section>

      <!-- Shadows -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">Shadows &amp; rings</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="t in shadows"
            :key="t.name"
            :name="t.name"
            :css-var="t.cssVar"
            kind="shadow"
          />
        </div>
      </section>

      <!-- Radii -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">Radii</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="t in radii"
            :key="t.name"
            :name="t.name"
            :css-var="t.cssVar"
            kind="radius"
          />
        </div>
      </section>

      <!-- Spacing -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">Spacing (4px base)</h2>
        <div class="spacing-list">
          <div v-for="t in spacing" :key="t.name" class="spacing-row">
            <div class="spacing-bar" :style="{ width: `var(${t.cssVar})` }" />
            <code class="swatch-label">{{ t.name }}</code>
          </div>
        </div>
      </section>

      <!-- Typography -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">Typography scale (.ad-*)</h2>
        <div class="type-list">
          <div v-for="t in typeClasses" :key="t.name" class="type-row">
            <code class="type-label">{{ t.name }}</code>
            <span :class="t.cls">Съешь же ещё этих мягких булок</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  padding-bottom: var(--s-12);
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: var(--s-4) var(--s-6);
  border-bottom: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: baseline;
  gap: var(--s-6);
  flex-wrap: wrap;
}

.page-content {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--s-7) var(--s-6);
  display: flex;
  flex-direction: column;
  gap: var(--s-9);
}

.token-section {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.section-title {
  color: var(--ink);
  padding-bottom: var(--s-2);
  border-bottom: 1px solid var(--line);
}

.section-note {
  color: var(--ink-soft);
}

.swatch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--s-4);
}

.token-swatch {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  min-width: 0;
}

.swatch-box {
  width: 100%;
  height: 56px;
  border-radius: var(--r-sm);
}

.swatch-label {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-soft);
  word-break: break-all;
}

/* Spacing */
.spacing-list {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.spacing-row {
  display: flex;
  align-items: center;
  gap: var(--s-4);
}

.spacing-bar {
  height: 8px;
  min-width: 4px;
  border-radius: var(--r-pill);
  background: var(--sage);
  flex-shrink: 0;
}

/* Typography */
.type-list {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.type-row {
  display: flex;
  align-items: baseline;
  gap: var(--s-4);
  padding: var(--s-3) var(--s-4);
  background: var(--card);
  border-radius: var(--r-sm);
  border: 1px solid var(--line-card);
  flex-wrap: wrap;
}

.type-label {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-soft);
  min-width: 120px;
  flex-shrink: 0;
}
</style>
