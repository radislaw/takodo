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
app/           — App.vue, AppLayout.vue (app-shell), router, i18n setup
pages/         — today/, tasks/, frequent/ (screens); design-tokens/, design-ui/ (dev only)
shared/ui/     — design system components; each in own folder (ComponentName.vue + spec + index.ts)
shared/lib/    — framework-free utilities: confetti.ts (canvas-confetti seam), useReward.ts (singleton)
shared/api/    — Pinia Colada composables: daily.ts, tasks.ts, frequent.ts
shared/styles/ — tokens.css (CSS custom properties for 12 themes), index.css (Tailwind + @utility)
locales/       — ru.json (all UI strings — no hardcoded text in .vue files)
api/client.ts  — openapi-fetch typed client (uses types.gen.ts)
analytics.ts   — track() no-op seam (intentionally deferred)
```

### API source layout (`apps/api/src/`)

```
app.ts        — buildApp() factory (Fastify instance, routes)
server.ts     — entry point; wires real Prisma singleton + cached getUserId
db/client.ts  — Prisma singleton
domain/       — pure business logic (normalize, tree, task-status, frequent, types)
service/      — Fastify handlers wiring domain + Prisma (tasks, daily, frequent)
analytics.ts  — track() no-op seam
```

### Contract (`packages/contract/`)

`main.tsp` defines all models and interfaces: `Tasks` (CRUD + tree + complete/reopen/resolve-resistance), `Daily` (DailyList + DailyEntry with MIT flag), `Frequent` (tasks undone across N days). Compiled to `openapi/openapi.yaml`.

### AppLayout shell model

`AppLayout.vue` is an app-shell: `h-dvh overflow-hidden` wrapper → `absolute inset-0 overflow-y-auto` scroll container → `AppBottomNav` as `absolute inset-x-0 bottom-0` overlay (Vue fallthrough attributes). Pages must use `min-h-full pb-nav` (not `min-h-dvh`). `pb-nav` = `calc(5rem + env(safe-area-inset-bottom))`. `surface-nav` = frosted `backdrop-filter` via `--nav-bg` token (auto-adapts to all themes; cyberpunk override is solid).

### Reward system

`useReward` (`shared/lib/useReward.ts`) is a module-level singleton: `{ isVisible, celebrate(), hide() }`. `celebrate()` is called from `useCompleteTask.onSuccess` — fires once per task completion globally. `RewardBurst.vue` (`shared/ui/reward-burst/`) is mounted once in `AppLayout` via `<Teleport to="body">`.

## Commands

```bash
pnpm dev               # web (5173) + api (3001) in parallel
pnpm dev:web           # web only
pnpm dev:api           # api only (requires .env with DATABASE_URL)
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

Dev DB bring-up: `docker compose up -d` → `pnpm --filter @tootoo/api db:push` → `pnpm --filter @tootoo/api db:seed`.

## Single-contract rule

API changes **only** through TypeSpec (`.tsp`) → `pnpm contract:build` → `pnpm contract:gen`. Generated files (`openapi.yaml`, `types.gen.ts`) must not be edited by hand. No manual Zod schemas — validation comes from the contract (Fastify ajv on api, `openapi-fetch` on web).

## Security rules

Derived from the 2026-06 security audit — keep these invariants when touching the listed areas:

- **String inputs are bounded in the contract.** Every client-writable string gets `@maxLength` in `main.tsp` (`title` 500, `note` 5000, `name` 100). New string fields must declare a limit — ajv enforces it for free; never rely on handler-side checks.
- **Multi-write operations use `prisma.$transaction`.** `Tasks_complete`, `Tasks_reopen`, `Daily_addEntry` are transactional (status bubble-up, MIT-limit check). Any new handler doing read-then-write or multiple writes must be too. Test mocks: `prisma.$transaction.mockImplementation(async (fn) => fn(prisma))`.
- **Ownership checks on every id from the client.** Any `id`/`parentId`/`taskId` in params or body → verify the row exists **and** `userId` matches before use; otherwise 404 (single-user today, but auth is coming — don't create cross-tenant holes).
- **Tree traversal needs a cycle guard.** `bubbleUp`/`reopenTask` carry a `visited` Set; any new recursion/loop over `parentId` links must do the same (corrupt data must not hang the process).
- **Server binds localhost by default.** `HOST ?? '127.0.0.1'` in `server.ts` — never change the default back to `0.0.0.0`; opt in via env only.
- **Unbounded-growth queries get a window.** `Frequent_list` scans the last 30 days of daily lists, not all history. New aggregate queries over per-day data must be windowed.
- **No `v-html` with non-static content.** Vue interpolation only; the sole exceptions are static i18n strings on dev-only pages.
- **No secrets in code.** Env vars only; `.env` is gitignored. No raw SQL (Prisma query API only).
- **Explicit `onDelete` on every relation.** Task self-relation is `SetNull` (children become roots) — set the action consciously on new relations, never leave the default implicit.

Known accepted debt (MVP): no auth, no rate limiting — revisit before any non-localhost deployment.

## TDD (mandatory)

Cycle: test first → red → minimal implementation → green → refactor. Vitest for unit/integration, Playwright for E2E (`e2e/smoke.spec.ts`). Vitest excludes `e2e/` — do not move specs there.

## i18n

All UI strings in `apps/web/src/locales/ru.json`. ESLint enforces `no-raw-text` as error in `.vue` files. Always use `useI18n({ useScope: 'global' })` — omitting `useScope` causes runtime warnings. MVP is Russian; structure is ready for more locales.

## Analytics seam

`track(event: AnalyticsEvent)` exists as a no-op in both `apps/api/src/analytics.ts` and `apps/web/src/analytics.ts`. Call it from features; the real backend is deferred. `AnalyticsEvent` uses `pseudonymId` (not `userId`) by design for privacy.

## Git flow

- `main` — stable releases only.
- `develop` — integration branch; all work merges here on green `verify`.
- **Always create a branch before any implementation work** — never commit directly to `develop`.
- Branch naming: `feature/*`, `fix/*`, `chore/*`, `refactor/*` off `develop`.
- `hotfix/*` off `main`; merge to `main` then back to `develop`.
- Conventional commits: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `ci`.

## Stack ctx7 IDs

- Pinia Colada: `/posva/pinia-colada`
- TypeSpec: `/microsoft/typespec`
- Pull docs via `ctx7` before implementing (see `~/.claude/rules/context7.md`).

## Current state (Phase 0.7.1)

**Shipped screens:** Today (`/today`), Tasks (`/tasks`), Frequent (`/frequent`) — all wired to live API with Pinia Colada composables.

**API:** Single-user MVP, no auth. `server.ts` wires real Prisma singleton + cached `getUserId` (seed user by `SEED_USER_EMAIL`). CORS via `@fastify/cors` (`WEB_ORIGIN ?? http://localhost:5173`).

**Web data layer:** Composables in `shared/api/` — `useDailyToday`, `useTasks`, `useCreateTask`, `useAddDailyEntry`, `useUpdateDailyEntry`, `useRemoveDailyEntry`, `useCompleteTask`, `useReopenTask`, `useFrequent`. Query keys: `['daily', date]`, `['tasks']`, `['frequent']`.

**Today screen:** Brain dump input → task + daily entry; MIT toggle (limit 3, toast on overflow); done/reopen via checkbox; `AppProgressRing` (done/total).

**Tasks screen:** Full task tree via recursive `TaskTreeNode`; inline create, edit, delete, complete/reopen, `resolveResistance`.

**Frequent screen:** Tasks undone across N days; re-add to today action.

**Reward system:** Task completion → `celebrate()` → `RewardBurst` overlay with confetti + random praise phrase + emoji from i18n pool; `prefers-reduced-motion` respected.

**Nav:** `AppBottomNav` fixed at bottom via app-shell model; frosted glass (`surface-nav`); iOS safe-area via `env(safe-area-inset-bottom)`; `viewport-fit=cover` in `index.html`.
