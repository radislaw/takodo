# CLAUDE.md — tootoo

Project rules for agents. Full plan: `~/.claude/plans/todo-stateful-lynx.md`.

## Language convention

- **All development artifacts in English:** code, comments, identifiers, commit messages,
  CLAUDE.md, README, TypeSpec doc-comments, in-repo docs.
- **Product UI copy is Russian** (MVP language) — but only in i18n locale files
  (`apps/web/src/locales/*.json`), never hardcoded.
- Chat with the user is in Russian; the repo is English.

## Product purpose

Todo app for people with ADHD. Core ideas: **daily brain dump** + **recursive task splitting**
down to a level where the brain stops resisting. Wrapped in CBT mechanics (externalization,
task chunking, cognitive restructuring) and dopamine feedback (gain-framing — praise what's done,
never punish what isn't).

## Architecture (monorepo, pnpm workspaces)

- `apps/web` — frontend: Vue 3 (`<script setup>`) + Vite + TypeScript. Later: Pinia Colada
  (server-state), Pinia (UI-state), Tailwind, vue-i18n.
- `apps/api` — backend: TypeScript + Fastify. Later: Prisma → PostgreSQL.
- `packages/contract` — TypeSpec contract (single source of truth for the API) →
  `openapi/openapi.yaml` (committed). Consumer codegen wiring (ajv on api, openapi-fetch on web)
  happens when routes/queries are built.

TypeScript everywhere, `strict: true`. `typecheck` is part of `verify`.

## Single-contract rule

The API changes **only** through TypeSpec (`.tsp`) → regen OpenAPI + types.
Generated artifacts must **not** be edited by hand. **No manual Zod schemas** — validation comes
from the contract (native Fastify ajv on the backend; `openapi-typescript` + `openapi-fetch` on the
frontend).

## TDD (mandatory)

Cycle per task: test first → fails for the right reason → minimal implementation → green →
refactor. Runner — **Vitest** (web + api), E2E — **Playwright**.

## Git flow

- `main` — only tested functionality (stable releases).
- `develop` — main development branch; all work merges here.
- Each task = its own branch off `develop`: `feature/*`, `chore/*`, `fix/*`, `refactor/*`.
  Merge into `develop` only on green `verify`.
- `hotfix/*` — off `main` for urgent fixes; afterwards merge into `main` and back into `develop`.
- Commits — **conventional commits** (`feat`, `fix`, `chore`, `refactor`, `docs`, `test`, ...).

## i18n

**vue-i18n** on the frontend. All UI strings live only in locale files
(`apps/web/src/locales/*.json`). **Hardcoded strings are forbidden.** MVP is Russian; the structure
is ready for more locales. Server texts (push, email) also go through keys. _(Infra — Phase 0.)_

## Commands

- `pnpm dev` — run web + api in parallel.
- `pnpm dev:web` / `pnpm dev:api` — individually (web → http://localhost:5173, api → http://localhost:3001).
- `pnpm contract:build` — compile the TypeSpec contract → `openapi/openapi.yaml`.
- `pnpm build` — build all packages.
- _(Phase 0 will add:)_ `pnpm verify` (`contract:build` → `lint` → `format:check` → `typecheck` → `test`),
  `pnpm contract:gen`, `pnpm test:e2e`.

## Stack and docs

- Vue 3 + Vite + TypeScript.
- Fastify + Prisma + PostgreSQL.
- Pinia Colada — ctx7 ID `/posva/pinia-colada`.
- TypeSpec — ctx7 ID `/microsoft/typespec`.
- Pull docs via `ctx7` before implementing (see `~/.claude/rules/context7.md`).

## Current state

Scaffold + contract. Done: git flow (`main`/`develop`), pnpm monorepo, Vue page,
minimal Fastify (`/health`, `/api/hello`), CLAUDE.md, **TypeSpec contract** (`packages/contract`,
Phase 0.4 surface: Task tree, DailyList/Entry, Frequent → `openapi/openapi.yaml`).
**Deferred in Phase 0:** Prisma/Postgres/docker-compose, consumer codegen wiring (ajv on api,
openapi-fetch/openapi-typescript on web), Tailwind + `tokens.css` + 11 themes, UI components,
Pinia Colada, i18n, Vitest/Playwright, `verify` Stop-hook, analytics seam.
