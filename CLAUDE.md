# CLAUDE.md — tootoo

Правила проекта для агентов. Полный план: `~/.claude/plans/todo-stateful-lynx.md`.

## Назначение продукта

Todo-приложение для людей с СДВГ. Ключевые идеи: **ежедневная выгрузка из головы** +
**рекурсивное дробление задачи** до уровня, где мозг не сопротивляется. Обёрнуто в КПТ-механики
(externalization, task chunking, cognitive restructuring) и дофаминовую обратную связь
(gain-framing — хвалим за сделанное, не наказываем за несделанное).

## Архитектура (монорепо, pnpm workspaces)

- `apps/web` — фронтенд: Vue 3 (`<script setup>`) + Vite + TypeScript. Позже: Pinia Colada
  (server-state), Pinia (UI-state), Tailwind, vue-i18n.
- `apps/api` — бэкенд: TypeScript + Fastify. Позже: Prisma → PostgreSQL.
- `packages/contract` — TypeSpec-контракт (источник правды API) + сгенерённые OpenAPI/типы. _(Phase 0)_

TypeScript сквозной, `strict: true` везде. `typecheck` входит в `verify`.

## Правило единого контракта (когда появится `packages/contract`)

API меняется **только** через TypeSpec (`.tsp`) → regen OpenAPI + типы.
Сгенерированные артефакты руками **не править**. **Ручных Zod-схем нет** — валидация из контракта
(родной ajv Fastify на бэке; `openapi-typescript` + `openapi-fetch` на фронте).

## TDD (обязателен)

Цикл на каждую задачу: тест первым → падает по правильной причине → минимальная реализация →
зелёный → рефактор. Раннер — **Vitest** (фронт + бэк), E2E — **Playwright**.

## Git flow

- `main` — только оттестированный функционал (стабильные релизы).
- `develop` — основная ветка разработки; вся работа вливается сюда.
- Каждая задача = отдельная ветка от `develop`: `feature/*`, `chore/*`, `fix/*`, `refactor/*`.
  Мёрдж в `develop` только при зелёном `verify`.
- `hotfix/*` — от `main` для срочного фикса; после — мёрдж в `main` и обратно в `develop`.
- Коммиты — **conventional commits** (`feat`, `fix`, `chore`, `refactor`, `docs`, `test`, ...).

## i18n

**vue-i18n** на фронте. Все строки UI — только в файлах локали (`apps/web/src/locales/*.json`).
**Хардкод строк запрещён.** MVP — русский; структура готова к доп. локалям. Серверные тексты
(push, email) — тоже через ключи. _(Инфраструктура — Phase 0.)_

## Команды

- `pnpm dev` — запуск web + api параллельно.
- `pnpm dev:web` / `pnpm dev:api` — по отдельности (web → http://localhost:5173, api → http://localhost:3001).
- `pnpm build` — сборка всех пакетов.
- _(Phase 0 добавит:)_ `pnpm verify` (`contract:build` → `lint` → `format:check` → `typecheck` → `test`),
  `pnpm contract:gen`, `pnpm test:e2e`.

## Стек и доки

- Vue 3 + Vite + TypeScript.
- Fastify + Prisma + PostgreSQL.
- Pinia Colada — ctx7 ID `/posva/pinia-colada`.
- TypeSpec — ctx7 ID `/microsoft/typespec`.
- Доки тянуть через `ctx7` перед реализацией (см. `~/.claude/rules/context7.md`).

## Текущее состояние

Скаффолд (Hello World). Сделано: git flow (`main`/`develop`), pnpm-монорепо, Vue-страница,
минимальный Fastify (`/health`, `/api/hello`), CLAUDE.md.
**Отложено в Phase 0:** Prisma/Postgres/docker-compose, TypeSpec-контракт + кодеген, Tailwind +
`tokens.css` + 11 тем, UI-компоненты, Pinia Colada, i18n, Vitest/Playwright, Stop-хук `verify`,
analytics seam.
