# Changelog

All notable changes to tootoo are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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

[Unreleased]: https://github.com/radislavalilov/tootoo/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/radislavalilov/tootoo/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/radislavalilov/tootoo/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/radislavalilov/tootoo/releases/tag/v0.1.0
