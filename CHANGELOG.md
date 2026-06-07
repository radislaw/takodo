# Changelog

All notable changes to tootoo are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.10.0] — 2026-06-07 · AMOLED default theme, task date groups, today task cards

### Added

- **`TodayTaskCard.vue`** (`pages/today/ui/`) — task card for Today screen matching Tasks page style; checkbox, title (nav to detail), subtask progress counter, MIT (⚡ Главное) badge/button; no action sheet; full spec (7 tests)

### Changed

- **Default theme** — `AppLayout` now applies `data-theme="amoled"` by default; pure-black surfaces, near-black cards, crisp sage-teal accent
- **`TasksPage`** — root tasks grouped by creation date (`createdAt`); sections labelled "Сегодня" / "Вчера" / formatted date (`d MMMM` ru-RU); newest groups first; `tasks.dateGroup.*` i18n keys added
- **`TaskCard`** — `⋯` action icon colour lifted from `text-ink-faint` → `text-ink-soft`, size 18 → 20 px for improved visibility
- **`TodayPage`** — entry list replaced with `TodayTaskCard`; `childProgress` computed added from flat task list; `AppCheckbox` / `AppBadge` / `useRemoveDailyEntry` removed from page-level (moved into card)

## [0.9.0] — 2026-06-07 · Task card redesign with action sheet and breadcrumbs

### Added

- **`AppActionSheet`** (`shared/ui/action-sheet/`) — teleport-based modal with backdrop, Esc dismiss, and scroll-lock; reusable shared primitive; full spec + barrel export
- **`TaskCard.vue`** (`pages/tasks/ui/`) — flat task card with checkbox, title, child progress counter (`done/total`), and `⋯` action sheet trigger; replaces `TaskTreeNode` on all screens
- **`more` icon** added to shared icon registry (`shared/ui/icon/`)
- **`tasks.card.*` i18n keys** — `progress`, `actions.estimate`, `actions.resolve`, `actions.delete`, `confirmDelete.*`, `breadcrumb.*` in `ru.json`

### Changed

- **`TasksPage`** — renders root tasks only via flat list; child progress computed from flat task array (done/total); `TaskTreeNode` → `TaskCard`
- **`TaskDetailPage`** — gained breadcrumb trail, hero block with `AppProgressRing`, subtask list via `TaskCard`, and confirm-delete action sheet
- **`TaskTreeNode.vue`** and **`TaskTreeNode.spec.ts`** deleted — fully replaced by `TaskCard`

## [0.8.0] — 2026-06-07 · Task detail page with subtask drill-down

### Added

- **`TaskDetailPage`** (`pages/tasks/ui/`) — dedicated screen at `/tasks/:id`; shows task title (inline-editable), note, estimate, resistance chip; subtask list with complete/reopen/delete; inline add-subtask input; loading + not-found states
- **`useTaskTree(id)`** composable in `shared/api/tasks.ts` — calls `GET /tasks/{id}/tree`; reactive key `['tasks', id, 'tree']` via function form; throws on 404
- **`tasks.detail.*` i18n keys** — `back`, `subtasks`, `addSubtask`, `addSubtaskPlaceholder`, `notePlaceholder`, `notFound` in `ru.json`

### Changed

- `TaskTreeNode` title — `<span>` → `<button>` that calls `router.push('/tasks/:id')` for drill-down navigation
- `router/index.ts` — route `/tasks/:id` added before `/frequent`
- All mutations in `shared/api/tasks.ts` — `exact: true` → `exact: false` so prefix-match invalidates both `['tasks']` and `['tasks', id, 'tree']` on any write

## [0.7.1] — 2026-06-07 · Bottom nav: iOS safe-area + frosted glass

### Added

- **`--nav-bg` token** in `tokens.css` — `color-mix(in srgb, var(--card) 80%, transparent)` adapts to every theme automatically; cyberpunk override: solid `#161334`
- **`surface-nav` utility** — frosted `backdrop-filter: blur(16px)` surface using `--nav-bg`
- **`pb-nav` utility** — `calc(5rem + env(safe-area-inset-bottom))` keeps content above nav on iOS

### Changed

- `index.html` — added `viewport-fit=cover` to meta viewport (required for `env(safe-area-inset-*)` on iOS)
- `AppLayout.vue` — switched to app-shell model: `h-dvh overflow-hidden` wrapper + `absolute inset-0 overflow-y-auto` scroll container + `AppBottomNav` as `absolute inset-x-0 bottom-0` overlay
- `AppBottomNav.vue` — `surface-card rounded-b-3xl pb-4` → `surface-nav` with safe-area padding; inner `max-w-xl` wrapper centers buttons on wide screens; touch targets `min-h-[44px]`; label `text-[11px]`; icon size 22
- `TodayPage`, `TasksPage`, `FrequentPage` — `min-h-dvh` → `min-h-full`; bottom padding → `pb-nav`

## [0.7.0] — 2026-06-07 · Phase 0-reward: RewardBurst

### Added

- **`canvas-confetti`** — runtime dep + `@types/canvas-confetti` dev dep in `apps/web`
- **`shared/lib/confetti.ts`** — seam over `canvas-confetti`; exports `fireConfetti()` (single burst, apricot palette) and `fireFireworks()` (rAF loop, bilateral origin); future swap to `@tsparticles/confetti` rewrites only this file
- **`shared/lib/useReward.ts`** — module-level singleton composable `{ isVisible, celebrate(), hide() }`; UI/i18n-free
- **`RewardBurst.vue`** (`shared/ui/reward-burst/`) — `<Teleport to="body">` overlay, `pointer-events-none`; shows random praise phrase + random emoji from i18n; `fireConfetti` + `fireFireworks` on show; `prefers-reduced-motion` → particles skipped, soft fade only; auto-close 1800 ms; spring-pop entry animation; `role="status"` + `aria-live="polite"`
- **`reward.*` i18n keys** — 50 motivating praise phrases + 15 emoji variants + `aria` label in `ru.json`
- **`window.matchMedia` mock** in `apps/web/src/test/setup.ts` — fixes jsdom missing API for RewardBurst specs
- **`useCompleteTask.onSuccess`** → `celebrate()` — single trigger per user action, covers Today + Tasks + any future screen automatically
- **`<RewardBurst>` in `AppLayout.vue`** — mounted globally once, wired to `useReward` singleton

### Changed

- `shared/ui/index.ts` — exports `RewardBurst`

## [0.6.0] — 2026-06-06 · Phase 0.6: Tasks + Frequent screens

### Added

- **Tasks screen** (`pages/tasks/`) — full task tree with recursive `TaskTreeNode` component; inline create, edit, delete, complete/reopen, `resolveResistance`; i18n `tasks.*` namespace
- **Frequent screen** (`pages/frequent/`) — aggregated view of tasks undone across N days; re-add to today action; i18n `frequent.*` namespace with Russian plural rules
- **Bottom navigation** (`AppBottomNav`) — wired in `AppLayout`; routes: `/today`, `/tasks`, `/frequent`; active-tab computed from `route.path`
- **`useResolveResistance`, `useUpdateTask`, `useDeleteTask`** composables in `shared/api/tasks.ts`
- **`useFrequent`** composable in `shared/api/`

### Changed

- Router default redirect changed from `/today` to `/today` (preserved); `AppLayout` now wraps all routes with `chrome` meta flag support
- `useI18n({ useScope: 'global' })` applied to all 10 Vue components to fix console warnings

## [0.5.0] — 2026-06-06 · Phase 0.5: Today Screen

### Added

- **Live API wiring** — `server.ts` now passes real Prisma singleton + cached `getUserId` (seed-user lookup by `SEED_USER_EMAIL`); falls back with a clear error if seed not run
- **CORS** — `@fastify/cors` registered in `buildApp()`; origin controlled via `WEB_ORIGIN` env (default `http://localhost:5173`)
- **`db:push` script** — `prisma db push` added to `apps/api/package.json`; `.env` + `.env.example` with `DATABASE_URL` for docker-compose Postgres
- **Pinia + Pinia Colada** — installed in `apps/web`; registered in `main.ts` before router/i18n
- **`shared/api/` composables** — typed wrappers over `openapi-fetch` client: `useDailyToday` (get-or-create with 404 fallback), `useTasks`, `useCreateTask`, `useAddDailyEntry`, `useUpdateDailyEntry`, `useRemoveDailyEntry`, `useCompleteTask`, `useReopenTask`; each mutation invalidates relevant query keys
- **Today screen** (`pages/today/`) — brain dump input → create task + add daily entry; MIT toggle (3-limit enforced, gentle toast on overflow); done/reopen via `AppCheckbox`; `AppProgressRing` (done/total); i18n `today.*` namespace
- **Router** — `/today` route added; `/` redirect changed from `/design/tokens` to `/today`; design pages kept for dev

### Changed

- `apps/api/src/server.ts` — replaced `buildApp({ logger: true })` (→ stubService) with live prisma + getUserId wiring

## [0.4.0] — 2026-06-05 · Phase 0.4: API Layer

### Added

- **Fastify API handlers** — 15 operationId handlers: Tasks CRUD + tree + complete/reopen/resolveResistance (9), Daily CRUD + entry management (5), Frequent aggregation (1)
- **Domain logic** — pure functions: `normalizeTitle`, `assembleTree`, `bubbleUp`, `reopenTask`, `aggregateFrequent`; TDD-driven with 66 passing tests
- **Mock-Prisma route tests** — Fastify integration tests with mocked Prisma; validates OpenAPI contract enforcement and handler behavior
- **`prisma/seed.ts`** — MVP user seeding via `SEED_USER_EMAIL` env var; `pnpm db:seed` wired in `package.json`
- **ESLint rule enhancement** — `varsIgnorePattern: ^_` added for destructuring; fixes `ajv-formats` Plugin type incompatibility with TS cast

### Changed

- API source layout refined: `db/client.ts` (singleton), `domain/` (pure logic), `service/` (handlers)
- `buildApp()` return type simplified (removed `FastifyInstance` annotation for flexibility)

## [0.3.0] — 2026-06-05 · Phase 0.3: Infrastructure

### Added

- **Prisma + PostgreSQL** — schema with `User`, `Task` (tree), `DailyList`, `DailyEntry`, `AnalyticsEvent`; `docker-compose.yml` (Postgres 17, localhost-only binding)
- **Contract codegen pipeline** — `contract:gen` script generates `types.gen.ts` from OpenAPI; type-safe `openapi-fetch` client wired in `apps/web`
- **Analytics seam** — `track()` no-op in both api and web; `pseudonymId`-based (no userId) for privacy; intentionally deferred until real analytics backend chosen
- **Playwright E2E** — `playwright.config.ts`, smoke test (`e2e/smoke.spec.ts`); Vitest configured to exclude `e2e/` to prevent runner conflict
- **Claude Stop-hook** — `pnpm verify` runs automatically on session end; cwd-safe via `git rev-parse --show-toplevel`

### Changed

- PostgreSQL Docker port restricted to `127.0.0.1:5432` (was `0.0.0.0`)
- `openlyBuiltDependencies` updated to unblock `prisma` build scripts in pnpm
- Generated `types.gen.ts` excluded from ESLint and Prettier

## [0.2.0] — 2026-06-05 · Phase 0.2: Quality Pipeline

### Added

- **`pnpm verify`** pipeline: `contract:build` → `lint` → `format:check` → `typecheck` → `test`
- **Vitest** unit test setup for `apps/web` and `apps/api`
- **CI** (GitHub Actions) — runs `pnpm verify` on push/PR to `main` and `develop`
- **i18n** with `vue-i18n` — all UI strings in `apps/web/src/locales/ru.json`; ESLint rule `no-raw-text` enforced as error

### Changed

- Updated `@vue/test-utils`, `@types/node` (24→25), `npm-run-all2` (8→9)

## [0.1.0] — 2026-06-03 · Phase 0.1: Scaffold

### Added

- **Monorepo** — pnpm workspaces with `apps/web` and `apps/api`
- **`apps/web`** — Vue 3 + Vite + TypeScript (`<script setup>`, `strict: true`)
- **`apps/api`** — Fastify with `/health` and `/api/hello` endpoints
- **`packages/contract`** — TypeSpec contract → `openapi/openapi.yaml` (Task tree, DailyList/Entry, Frequent surface)
- **Git flow** — `main` / `develop` branches; conventional commits enforced
- **CLAUDE.md** — project rules for AI agents

[Unreleased]: https://github.com/radislavalilov/tootoo/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/radislavalilov/tootoo/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/radislavalilov/tootoo/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/radislavalilov/tootoo/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/radislavalilov/tootoo/releases/tag/v0.1.0
