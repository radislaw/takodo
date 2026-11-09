# TakoDo

A todo app for people with ADHD: a daily brain dump plus recursive task splitting down to a level
where the brain stops resisting. CBT mechanics + dopamine feedback.

## Structure (pnpm monorepo)

- `apps/web` — Vue 3 + Vite + TypeScript.
- `apps/api` — Fastify + TypeScript.
- `packages/contract` — TypeSpec API contract (single source of truth) → `openapi/openapi.yaml`.

## Development

```bash
pnpm install          # from the repo root
pnpm dev              # web + api in parallel
pnpm dev:web          # web only  → http://localhost:5173
pnpm dev:api          # api only  → http://localhost:3001
pnpm contract:build   # compile the TypeSpec contract → openapi/openapi.yaml
```

API: `GET /health`, `GET /api/hello`.

## GitHub Pages demo

Pushing to `main` deploys a backend-less demo of the web app (`.github/workflows/pages.yml`).
Enable it once: repo **Settings → Pages → Source: GitHub Actions**. The site is served from
`https://<user>.github.io/<repo>/`; the API is emulated in the browser (`VITE_DEMO=true`, data in
`localStorage`). Try it locally:

```bash
VITE_BASE=/takodo/ VITE_DEMO=true pnpm --filter @takodo/web build
```

## Docs

- Implementation plan: `~/.claude/plans/todo-stateful-lynx.md`
- Agent rules: `CLAUDE.md`

> Convention: the codebase is English (code, comments, docs); product UI copy is Russian and lives
> only in i18n locale files.
