<script setup lang="ts">
const stack = ['Vue 3', 'Vite', 'TypeScript', 'Fastify', 'pnpm monorepo']
</script>

<template>
  <main class="hello">
    <h1>👋 Hello World</h1>
    <p class="subtitle">tootoo — ADHD-friendly todo</p>
    <p class="note">Скаффолд работает. Дальше — Phase 0: дизайн-токены, компоненты, контракт.</p>
    <ul class="stack">
      <li v-for="item in stack" :key="item">{{ item }}</li>
    </ul>
  </main>
</template>

<style scoped>
.hello {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-family: system-ui, -apple-system, sans-serif;
  text-align: center;
  padding: 2rem;
}
h1 {
  font-size: 2.5rem;
  margin: 0;
}
.subtitle {
  font-size: 1.25rem;
  font-weight: 600;
  color: #4a6b5a;
  margin: 0;
}
.note {
  color: #6b7280;
  max-width: 28rem;
  margin: 0;
}
.stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}
.stack li {
  background: #eef2ee;
  color: #3a554a;
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  font-size: 0.9rem;
}
</style>
