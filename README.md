# tootoo

Todo-приложение для людей с СДВГ: ежедневная выгрузка из головы + рекурсивное дробление задач
до уровня, где мозг не сопротивляется. КПТ-механики + дофаминовая обратная связь.

## Структура (pnpm monorepo)

- `apps/web` — Vue 3 + Vite + TypeScript.
- `apps/api` — Fastify + TypeScript.
- `packages/*` — общие пакеты (TypeSpec-контракт — позже).

## Разработка

```bash
pnpm install        # из корня
pnpm dev            # web + api параллельно
pnpm dev:web        # только фронт → http://localhost:5173
pnpm dev:api        # только API  → http://localhost:3001
```

API: `GET /health`, `GET /api/hello`.

## Документы

- План реализации: `~/.claude/plans/todo-stateful-lynx.md`
- Правила для агентов: `CLAUDE.md`
