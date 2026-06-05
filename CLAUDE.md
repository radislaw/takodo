# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language convention

- **All development artifacts in English:** code, comments, identifiers, commit messages, CLAUDE.md, TypeSpec doc-comments, in-repo docs.
- **Product UI copy is Russian** (MVP language) — only in `apps/web/src/locales/*.json`, never hardcoded.
- Chat with the user is in Russian; the repo is English.

## Product purpose

Todo app for people with ADHD. Core ideas: **daily brain dump** + **recursive task splitting** down to a level where the brain stops resisting. CBT mechanics (externalization, task chunking) + dopamine feedback (gain-framing — praise what's done, never punish what isn't).

## Architecture

pnpm monorepo with three packages:

- `apps/web` — Vue 3 (`<script setup>`) + Vite + TypeScript + Tailwind 4 + vue-i18n
- `apps/api` — Fastify + Prisma + PostgreSQL (via docker-compose)
- `packages/contract` — TypeSpec → `openapi/openapi.yaml` + `openapi/types.gen.ts` (generated, do not edit)

### Web source layout (`apps/web/src/`)

```
app/          — App.vue, router, i18n setup
pages/        — feature pages (design-tokens/, design-ui/ — dev only; app pages TBD)
shared/ui/    — design system components (AppButton, AppInput, AppBadge, …)
shared/styles/ — tokens.css (CSS custom properties), index.css
locales/      — ru.json (all UI strings)
api/client.ts — openapi-fetch typed client (uses types.gen.ts)
analytics.ts  — track() no-op seam (intentionally deferred)
```

Each UI component lives in its own folder with `ComponentName.vue`, `ComponentName.spec.ts`, and `index.ts` barrel.

### API source layout (`apps/api/src/`)

```
app.ts        — buildApp() factory (Fastify instance, routes)
server.ts     — entry point (starts the server)
analytics.ts  — track() no-op seam
prisma/       — schema.prisma lives at apps/api/prisma/schema.prisma
```

### Contract (`packages/contract/`)

`main.tsp` defines all models and interfaces: `Tasks` (CRUD + tree + complete/reopen/resolve-resistance), `Daily` (DailyList + DailyEntry with MIT flag), `Frequent` (tasks undone across N days). Compiled to `openapi/openapi.yaml`.

## Commands

```bash
pnpm dev               # web (5173) + api (3001) in parallel
pnpm dev:web           # web only
pnpm dev:api           # api only
pnpm verify            # full pipeline: contract:build → contract:gen → lint → format:check → typecheck → test
pnpm contract:build    # TypeSpec → openapi/openapi.yaml
pnpm contract:gen      # openapi.yaml → packages/contract/openapi/types.gen.ts
pnpm lint              # ESLint across all packages
pnpm format            # Prettier write
pnpm test              # Vitest (all packages)
pnpm test:e2e          # Playwright smoke test
```

Run a single test file:

```bash
pnpm --filter @tootoo/web vitest run src/shared/ui/button/AppButton.spec.ts
pnpm --filter @tootoo/api vitest run src/app.spec.ts
```

## Single-contract rule

API changes **only** through TypeSpec (`.tsp`) → `pnpm contract:build` → `pnpm contract:gen`. Generated files (`openapi.yaml`, `types.gen.ts`) must not be edited by hand. No manual Zod schemas — validation comes from the contract (Fastify ajv on api, `openapi-fetch` on web).

## TDD (mandatory)

Cycle: test first → red → minimal implementation → green → refactor. Vitest for unit/integration, Playwright for E2E (`e2e/smoke.spec.ts`). Vitest excludes `e2e/` — do not move specs there.

## i18n

All UI strings in `apps/web/src/locales/ru.json`. ESLint enforces `no-raw-text` as error in `.vue` files. MVP is Russian; structure is ready for more locales.

## Analytics seam

`track(event: AnalyticsEvent)` exists as a no-op in both `apps/api/src/analytics.ts` and `apps/web/src/analytics.ts`. Call it from features; the real backend is deferred. `AnalyticsEvent` uses `pseudonymId` (not `userId`) by design for privacy.

## Git flow

- `main` — stable releases only.
- `develop` — integration branch; all work merges here on green `verify`.
- Branch naming: `feature/*`, `fix/*`, `chore/*`, `refactor/*` off `develop`.
- `hotfix/*` off `main`; merge to `main` then back to `develop`.
- Conventional commits: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `ci`.

## Stack ctx7 IDs

- Pinia Colada: `/posva/pinia-colada`
- TypeSpec: `/microsoft/typespec`
- Pull docs via `ctx7` before implementing (see `~/.claude/rules/context7.md`).

## Current state (Phase 0.4 complete)

API layer is in place. What exists: all Phase 0.3 infra plus — Fastify API with 15 operationId handlers (Tasks CRUD + tree + complete/reopen/resolveResistance, Daily CRUD + entry management, Frequent list), domain logic (`normalizeTitle`, `assembleTree`, `bubbleUp`, `reopenTask`, `aggregateFrequent`), mock-Prisma route tests (66 tests), `prisma/seed.ts` (MVP user upsert via `SEED_USER_EMAIL`), `db:seed` script wired in package.json.

**API source layout** (`apps/api/src/`):

```
db/client.ts      — Prisma singleton
domain/           — pure business logic (normalize, tree, task-status, frequent, types)
service/          — Fastify handlers wiring domain + Prisma (tasks, daily, frequent, stub)
```

**Phase 0.5 next:** web screens (task list, daily view, frequent view) using `openapi-fetch` typed client and Pinia Colada for server state.
