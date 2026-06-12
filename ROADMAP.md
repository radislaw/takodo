# tootoo — Roadmap

Product: Todo app for people with ADHD. Core loop: **brain dump → recursive split → do-mode → reward**.

---

## Shipped

### Phase 0 — Foundation (2026-06-02 – 06-06)

- Monorepo setup (pnpm, Vite, Fastify, Prisma, TypeSpec contract)
- 12 UI components + design tokens (12 themes)
- i18n infrastructure (ru.json, ESLint no-raw-text)
- Today screen: brain dump, MIT toggle, progress ring
- Tasks screen: recursive tree, inline CRUD, resolveResistance
- Frequent screen: undone-across-N-days list, re-add to today
- RewardBurst: confetti + praise phrases on task completion

### Phase 0.7 — Core UX polish (2026-06-07)

- Task detail page with subtask drill-down (`/tasks/:id`)
- Action sheet on task cards
- AMOLED default theme; date-grouped task list
- iOS safe-area frosted-glass bottom nav (app-shell model)

### Phase 0.8 — Gamification I (2026-06-10 – 06-11)

- Do-mode: fullscreen focus queue, MIT ordering, skip
- Pomodoro timer: 25-min conic ring, Web Audio chime, vibrate, per-task stats
- Streak shields (earn every 5 active days, cap 2; auto-consume on missed day)
- Gentle badge: move-to-tomorrow, `gentleMoves` counter
- XP (`done×10 + MIT×5 + pomodoro×5`) + level (`floor(√(xp/100)) + 1`)
- Theme unlocks by level (12 themes, levels 1–5; server-enforced)
- Daily quests: deterministic 3/day (FNV hash), tier roll 70/25/5, XP claim
- Comeback banner: anti-shame return card after ≥2 missed days

### Phase 0.9 — PWA + Notifications (2026-06-11 – 06-12)

- PWA shell: `manifest.webmanifest`, hand-rolled `sw.js`, iOS meta tags
- VAPID Web Push: subscribe/unsubscribe API, `PushSubscription` model
- Cron scheduler: morning (9:00 UTC) + evening (20:00 UTC) push jobs
- User notif prefs: `notifMorning` / `notifEvening` toggles on Profile page
- Quality audit: 6 bugs fixed (quest TZ, cache invalidation, push errors, epic race, SW cache eviction, scheduler stop handle)

### Phase 0.9.1 — Help & Onboarding (2026-06-12)

- `/help` page: accordion with 11 sections (nav guide, today, do-mode, tasks, quests, rewards, levels, themes, notif, XP, philosophy + FAQ)
- ProfilePage "Справка" link

### Phase 0.9.2 — Activity heatmap (2026-06-12)

- `GET /rewards/heatmap` (`weeks` window, default 12; client-local `date`, ±1 day validated; query windowed by `completedAt`)
- `computeHeatmap` domain: Monday-aligned grid ending on the current week's Sunday; per-day completion counts + shielded-day flags
- `ActivityHeatmap.vue` shared component: GitHub-style column grid, 5 intensity levels, today ring, shield annotation, month labels + legend
- On Rewards page (full grid) and Today screen (compact, labels off; shown only with activity)
- Rewards cache invalidations widened to prefix-match so the heatmap refreshes on completion

---

## Up next (no specific order)

### Settings page

- Standalone `/settings` route (started, session limit hit)
- Language selector (structure ready, single locale for now)
- Data export / account reset

### AI TaskSplitter seam

- Button "Помоги разбить" on task detail → LLM suggests N subtasks
- `POST /tasks/:id/split` in contract; web shows editable suggestion list
- `analytics.track('task_split')` seam wired

### Logo & brand

- 16 logo concepts designed (E and B variants nominated)
- Select final, update `logo.svg` + `manifest.webmanifest` icons

### Leaderboard / social proof (Phase 2)

- Anonymous weekly leaderboard (tasks done)
- Streak comparison with friends (invite code)
- Requires auth — blocked until auth ships

---

## Future / Deferred

### R9 `feat/welcome-calendar`

- Onboarding calendar: user marks active days for streak seed
- Deferred until public launch (requires auth + user identity)

### Auth

- Magic-link or OAuth
- Multi-user: each user's data isolated by `userId`
- Prerequisite for leaderboard, sync, notifications per-user push

### Rate limiting + deployment hardening

- Accepted MVP debt — revisit before any non-localhost deployment
- `@fastify/rate-limit` on all mutation routes
- `HOST=0.0.0.0` only via env (default already `127.0.0.1`)

### Difficulty scaling

- Quest difficulty auto-adjusts based on recent completion rate
- Streak difficulty: longer streak → harder bonus quests

### AI coaching (Phase 3)

- Weekly CBT check-in: "What blocked you this week?"
- Pattern detection: recurring undone tasks → proactive split suggestion
- Requires stable user data history (≥2 weeks)

---

## Current state

| Metric        | Value                                                           |
| ------------- | --------------------------------------------------------------- |
| Tests         | 623 (263 API + 360 web)                                         |
| Screens       | Today, Tasks, Frequent, Do-mode, Profile, Rewards, Help         |
| Themes        | 12 (AMOLED default)                                             |
| Gamification  | XP, levels, streaks, shields, badges, quests, comeback, heatmap |
| Notifications | VAPID push (morning + evening cron)                             |
| Auth          | None (single-user MVP, `SEED_USER_EMAIL`)                       |
| Deployment    | localhost only                                                  |
