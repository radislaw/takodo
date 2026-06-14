<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TokenSwatch from './TokenSwatch.vue'
import AppLogoMark from '@/shared/ui/logo-mark/AppLogoMark.vue'

const { t } = useI18n({ useScope: 'global' })

const pangram = computed(() => t('design.tokens.pangram'))

const themes = [
  { id: '', label: 'Sage' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'forest', label: 'Forest' },
  { id: 'lavender', label: 'Lavender' },
  { id: 'lavender-dark', label: 'Lavender Dark' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'high-contrast', label: 'High Contrast' },
  { id: 'high-contrast-dark', label: 'High Contrast Dark' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'eco', label: 'Eco' },
  { id: 'silent', label: 'Silent' },
  { id: 'amber', label: 'Amber' },
  { id: 'amoled', label: 'AMOLED' },
]

const activeTheme = ref('')

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

<!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
<template>
  <div class="page surface-app" :data-theme="activeTheme || undefined">
    <header class="page-header surface-card">
      <div class="header-title">
        <AppLogoMark :size="40" />
        <h1 class="ad-h2">{{ t('design.tokens.pageTitle') }}</h1>
      </div>
      <div class="theme-switcher">
        <button
          v-for="thm in themes"
          :key="thm.id"
          class="theme-btn"
          :class="{ active: activeTheme === thm.id }"
          :data-theme="thm.id || undefined"
          @click="activeTheme = thm.id"
        >
          {{ thm.label }}
        </button>
      </div>
    </header>

    <main class="page-content">
      <!-- Logo -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">Logo mark</h2>
        <p class="ad-sm section-note">
          AppLogoMark — inline SVG, тема-адаптивный градиент через <code>--logo-*</code> +
          <code>color-mix</code>.
        </p>
        <div class="logo-backgrounds">
          <div class="logo-bg-cell" style="background: var(--card); border: 1px solid var(--line)">
            <AppLogoMark :size="120" />
            <code class="swatch-label">--card</code>
          </div>
          <div
            class="logo-bg-cell"
            style="background: var(--cream-deep); border: 1px solid var(--line)"
          >
            <AppLogoMark :size="120" />
            <code class="swatch-label">--cream-deep</code>
          </div>
          <div class="logo-bg-cell" style="background: var(--sage-deep)">
            <AppLogoMark :size="120" :light="true" />
            <code class="swatch-label" style="color: rgba(255, 255, 255, 0.6)"
              >--sage-deep (light)</code
            >
          </div>
          <div class="logo-bg-cell" style="background: #1a1a1a">
            <AppLogoMark :size="120" :light="true" />
            <code class="swatch-label" style="color: rgba(255, 255, 255, 0.5)"
              >#1a1a1a (light)</code
            >
          </div>
        </div>
        <div class="logo-sizes">
          <div v-for="sz in [16, 20, 24, 28, 32, 48, 64, 96]" :key="sz" class="logo-size-cell">
            <AppLogoMark :size="sz" />
            <code class="swatch-label">{{ sz }}px</code>
          </div>
        </div>
      </section>

      <!-- App Icons -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">App icons</h2>
        <p class="ad-sm section-note">
          <code>public/logo.svg</code> — 1024×1024, rx=200, используется для favicon и иконок
          приложения.
        </p>
        <h3 class="ad-sm icon-variant-title">Light</h3>
        <div class="icon-grid">
          <div v-for="sz in [16, 32, 48, 64, 128, 256, 512]" :key="sz" class="icon-cell">
            <img src="/logo.svg" :width="sz" :height="sz" alt="TakoDo icon" class="icon-img" />
            <code class="swatch-label">{{ sz }}×{{ sz }}</code>
          </div>
        </div>
        <h3 class="ad-sm icon-variant-title">Dark (prefers-color-scheme: dark)</h3>
        <div class="icon-grid">
          <div v-for="sz in [16, 32, 48, 64, 128, 256, 512]" :key="`d-${sz}`" class="icon-cell">
            <img
              src="/logo-dark.svg"
              :width="sz"
              :height="sz"
              alt="TakoDo icon dark"
              class="icon-img"
            />
            <code class="swatch-label">{{ sz }}×{{ sz }}</code>
          </div>
        </div>
        <div class="favicon-row">
          <div class="icon-cell">
            <img src="/favicon.ico" width="32" height="32" alt="favicon" class="icon-img" />
            <code class="swatch-label">favicon.ico</code>
          </div>
          <div class="icon-cell">
            <img
              src="/favicon-dark.ico"
              width="32"
              height="32"
              alt="favicon dark"
              class="icon-img"
            />
            <code class="swatch-label">favicon-dark.ico</code>
          </div>
        </div>
      </section>

      <!-- Surfaces -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">{{ t('design.tokens.section.surfaces') }}</h2>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p class="ad-sm section-note" v-html="t('design.tokens.note.surfaces')" />
        <div class="swatch-grid">
          <div v-for="tok in surfaces" :key="tok.name" class="token-swatch">
            <div
              class="swatch-box surface-preview"
              :class="`surface-${tok.name.replace('--cream', 'deep').replace('--card', 'card')}`"
              :style="{
                background: `var(${tok.cssVar})`,
                border: '1px solid var(--line)',
              }"
            />
            <code class="swatch-label">{{ tok.name }}</code>
          </div>
        </div>
      </section>

      <!-- Fills -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">{{ t('design.tokens.section.fills') }}</h2>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p class="ad-sm section-note" v-html="t('design.tokens.note.fills')" />
        <div class="swatch-grid">
          <div v-for="tok in fills" :key="tok.name" class="token-swatch">
            <div
              class="swatch-box"
              :class="tok.cssVar === '--accent-fill' ? 'fill-accent' : 'fill-reward'"
            />
            <code class="swatch-label">{{ tok.name }}</code>
          </div>
        </div>
      </section>

      <!-- Ink -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">{{ t('design.tokens.section.ink') }}</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="tok in ink"
            :key="tok.name"
            :name="tok.name"
            :css-var="tok.cssVar"
            kind="color"
          />
        </div>
      </section>

      <!-- Sage accent -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">{{ t('design.tokens.section.sage') }}</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="tok in sage"
            :key="tok.name"
            :name="tok.name"
            :css-var="tok.cssVar"
            kind="color"
          />
        </div>
      </section>

      <!-- Apricot reward -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">{{ t('design.tokens.section.apricot') }}</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="tok in apricot"
            :key="tok.name"
            :name="tok.name"
            :css-var="tok.cssVar"
            kind="color"
          />
        </div>
      </section>

      <!-- Semantic -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">{{ t('design.tokens.section.semantic') }}</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="tok in semantic"
            :key="tok.name"
            :name="tok.name"
            :css-var="tok.cssVar"
            kind="color"
          />
        </div>
      </section>

      <!-- Category dots -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">{{ t('design.tokens.section.categories') }}</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="tok in categories"
            :key="tok.name"
            :name="tok.name"
            :css-var="tok.cssVar"
            kind="color"
          />
        </div>
      </section>

      <!-- Lines -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">{{ t('design.tokens.section.lines') }}</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="tok in lines"
            :key="tok.name"
            :name="tok.name"
            :css-var="tok.cssVar"
            kind="color"
          />
        </div>
      </section>

      <!-- Shadows -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">{{ t('design.tokens.section.shadows') }}</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="tok in shadows"
            :key="tok.name"
            :name="tok.name"
            :css-var="tok.cssVar"
            kind="shadow"
          />
        </div>
      </section>

      <!-- Radii -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">{{ t('design.tokens.section.radii') }}</h2>
        <div class="swatch-grid">
          <TokenSwatch
            v-for="tok in radii"
            :key="tok.name"
            :name="tok.name"
            :css-var="tok.cssVar"
            kind="radius"
          />
        </div>
      </section>

      <!-- Spacing -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">{{ t('design.tokens.section.spacing') }}</h2>
        <div class="spacing-list">
          <div v-for="tok in spacing" :key="tok.name" class="spacing-row">
            <div class="spacing-bar" :style="{ width: `var(${tok.cssVar})` }" />
            <code class="swatch-label">{{ tok.name }}</code>
          </div>
        </div>
      </section>

      <!-- Typography -->
      <section class="token-section">
        <h2 class="ad-h4 section-title">{{ t('design.tokens.section.typography') }}</h2>
        <div class="type-list">
          <div v-for="tok in typeClasses" :key="tok.name" class="type-row">
            <code class="type-label">{{ tok.name }}</code>
            <span :class="tok.cls">{{ pangram }}</span>
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
  align-items: center;
  gap: var(--s-6);
  flex-wrap: wrap;
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}

.theme-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.theme-btn {
  font-family: var(--font-body);
  font-size: var(--fs-sm);
  font-weight: var(--w-med);
  color: var(--ink-soft);
  background: var(--cream-deep);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  padding: 4px var(--s-3);
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s;
}

.theme-btn:hover {
  color: var(--ink);
  border-color: var(--line-strong);
}

.theme-btn.active {
  color: var(--sage-deep);
  background: var(--sage-tint);
  border-color: var(--sage-tint-2);
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

/* Logo */
.logo-backgrounds {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-4);
}

.logo-bg-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-6);
  border-radius: var(--r-lg);
  min-width: 180px;
}

.logo-sizes {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--s-5);
  padding: var(--s-4);
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
}

.logo-size-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-2);
}

/* App Icons */
.icon-variant-title {
  margin: var(--s-4) 0 var(--s-2);
  color: var(--ink-soft);
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--s-5);
  padding: var(--s-4);
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
}

/* dark icon variant always previews on a dark plate */
.icon-grid:has(img[src='/logo-dark.svg']) {
  background: #14101f;
}

.icon-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-2);
}

.icon-img {
  border-radius: 22%;
  display: block;
}

.favicon-row {
  display: flex;
  gap: var(--s-4);
  padding: var(--s-4);
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
}
</style>
