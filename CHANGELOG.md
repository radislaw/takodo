# Changelog

All notable changes to TakoDo are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

- **AI assistant — chat controls + new agent capabilities.**
  - _Conversation management_: delete a conversation (`DELETE /ai/conversations/{id}`, cascade-deletes messages, ownership-checked → 404 otherwise), start a new chat, and a history drawer to switch between past conversations. First user message auto-titles the conversation so the list is scannable. `useDeleteConversation` composable; delete confirmed via an `AppActionSheet` bottom sheet (no native `confirm`).
  - _Retry / regenerate_: a "Повторить запрос" button under the last reply resends the last user turn — covers both transport failures and the open-model case where the request succeeds (200) but the agent apologises about an internal failure (the catch-based retry never fires there).
  - _View any day — `get_day` tool_: the agent can now read any past/future day's list (task title + done flag), so "что я не закончил вчера" works. Date computed from today's date in the prompt; read-only. `get_today` stays today-only.
  - _Propose task deletion — `request_delete_task` tool (confirm-gated)_: the agent never destroys directly. The tool writes nothing — it ownership-checks the task and emits a `request_delete` action; the web renders it as a destructive confirm chip → `AppActionSheet` → the existing `DELETE /tasks/{id}`. Only the user's tap deletes, so the reversible-actions-only invariant holds even under prompt injection. Prompt rules added for both tools; CLAUDE.md invariant updated.
  - New i18n under `assistant.*` (history/retry/confirm-delete copy, `action.request_delete`). Web 496 green; agent tool tests 31 green (get_day happy/empty/bad-date, request_delete proposes-no-write + cross-user 404).

- **UX usability pass — 6 ADHD-focused fixes** across the shipped screens (audit against fast-capture / low-load / gain-framing / never-punish).
  - _Today — brain dump always-on_: `BrainDumpBar` no longer gated behind `hidden md:flex`; the zero-friction capture now shows at every breakpoint (mobile FAB + sheet kept as the secondary "add with category" path).
  - _Today — three-zone hierarchy_: `QuestPanel` + `EveningJournal` grouped under a divider as secondary surfaces below the task spine; the duplicate mobile `SoftNote` removed.
  - _Anti-shame copy_: Frequent reworded (`hint` invitational; `undoneDays` → «ждёт N дней», no "undone" framing); Rewards heatmap now leads with a gain-framed «Активных дней: N» summary (`rewards.heatmap.activeSummary`) instead of reading as a wall of empty cells.
  - _Task detail — edit affordances_: new `pencil` icon beside the title and the note label; an empty note renders as a dashed tappable field (`tasks.detail.noteEmptyHint`) instead of a bare "—"; `editTitleAria` / `editNoteAria` labels added.
  - _Tasks — depth signal_: already-nested rows show a non-interactive `ChildProgress` badge via a new `TaskCard` `staticProgress` prop, so grandchild counts are visible without turning the list into a fully recursive tree.
  - _Shared `AppScreenHeader`_ (`shared/ui/screen-header/`) — one sticky card header (title + optional subtitle + optional back button, `a11y.back`) replacing the duplicated `<header>` markup in Tasks, Frequent, Help, and the Tasks-detail list pane.
  - 496 web tests green (new `AppScreenHeader` spec + updated `TodayPage` brain-dump visibility assertion).

- **UX declutter: Today screen, progress, Profile** — 8 UX improvements targeting ADHD focus load.
  - _Today — heatmap removed_ from Today screen (vanity metric without action; remains on Rewards page).
  - _Today — summary card stripped_ to 3 elements: progress ring + summary message + StreakFlame. Level chip moved to Rewards page; MIT counter removed (duplicated zap badges on each card).
  - _Today — EveningJournal shown only in the evening/night_ (`greetingKey` hours check); no longer pollutes the morning view.
  - _Today — QuestPanel collapsed_ by default; auto-opens when a claimable reward is ready; header shows `done/total` aggregate.
  - _TodayTaskCard — overflow menu_ for MIT toggle and move-to-tomorrow; only checkbox + play-button remain inline. MIT badge stays visible as a passive glanceable indicator.
  - _TaskCard (Tasks screen) — "Add to today"_ promoted to an inline icon button; `resolveResistance` removed from the overflow menu (primary path is the flame badge on the card).
  - _Child progress unified_ — new `ChildProgress` component (compact conic-gradient donut + `x/y` counter) replaces the horizontal bar on `TodayTaskCard` and the bare fraction on `TaskCard`; consistent visual language across all surfaces.
  - _Profile — survey and feedback collapsed_ into `ProfileCollapsible` accordions; headless prop avoids duplicated header markup; survey/feedback sections hidden by default to reduce scroll length.
  - _Celebrations decoupled_ — `planCelebrations` now emits modal events only for gift levels (theme unlocks); plain level-ups get `RewardBurst` only; no more stacked full-screen interruptions.

- **In-house authentication (JWT bearer)** — multi-user auth on the existing Fastify + Prisma + TypeSpec + Vue stack, no managed service. Email + password (argon2id, OWASP params: memoryCost 19456 KiB / timeCost 2 / parallelism 1) plus OAuth direct-wired: Google (OIDC, JWKS-verified `id_token`), Yandex (OAuth2 → `/info`), Apple (Sign in, ES256 `client_secret` JWT, `form_post`). **Protected-vs-public lives in the contract** — `@useAuth(BearerAuth)` on the `Takodo` namespace, `@useAuth(NoAuth)` on the `Auth` interface — enforced by a glue `BearerAuth` securityHandler (`auth/guard.ts`), never a hand-maintained allowlist. Handlers read the caller via `getUserId(req)` (the guard sets `req.userId`); the old single-user `getUserId()` closure is gone (8 `service/*.ts` flipped to `getUserId(req)`). **Tokens:** short-lived access (HS256, `typ:"access"`) + rotating refresh — opaque, stored HMAC-SHA256-hashed, rotated on every use, with `familyId` lineage; **reusing a revoked refresh revokes the whole family** (`refresh_reuse_detected`). **OAuth:** server-built authorize URL with single-use `state` + PKCE (S256, in-memory TTL store); account-linking happens **only on a provider-verified email** (takeover protection), else match by `(provider, sub)` or create a new user. **Data model:** `User.passwordHash?` / `emailVerified?`; new `AuthIdentity` (`@@unique([provider, providerAccountId])`) and `RefreshToken` (`tokenHash @unique`, `familyId`, `expiresAt`, `revokedAt`, `replacedBy`), all `onDelete: Cascade`. New contract models (`TokenPair`, `SignupRequest`, `LoginRequest`, `RefreshRequest`, `LogoutRequest`, `OAuthStartResponse`, `OAuthCallbackRequest`) + `ApiError.code` values (`invalid_credentials`, `email_taken`, `token_expired`, `token_invalid`, `refresh_reuse_detected`, `oauth_state_mismatch`, `oauth_exchange_failed`, `provider_unsupported`, `unauthenticated`). **Web:** `/login`, `/signup`, `/auth/callback` (chrome-less, public) + a `beforeEach` router guard redirecting unauthenticated users to `/login`; `api/client.ts` attaches the bearer and does a single-flight refresh-on-401; tokens held by `shared/lib/authStorage.ts`; composables in `shared/api/auth.ts` (`useSession`/`useLogin`/`useSignup`/`useLogout`/`useOAuthStart`/`useOAuthCallback`); native-form autocomplete (`username` / `current-password` / `new-password`) so password managers offer to save; **Yandex button shown only for `ru/kk/be/uz` locales**. CORS via `@fastify/cors` (`WEB_ORIGIN ?? http://localhost:5173`); server keeps `HOST ?? '127.0.0.1'`. New env: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TTL`, `REFRESH_TTL`, provider client id/secrets, `OAUTH_REDIRECT_BASE`, `SEED_USER_PASSWORD`. **Known MVP debt:** no rate-limit on `/auth/*` (add `@fastify/rate-limit` pre-deploy); refresh tokens in `localStorage` (XSS → CSP later); in-memory OAuth state (lost on restart → `OAuthState` table). 819 tests green (338 API + 481 web).
- **Theme toggle + unlock progression** — light↔dark toggle button (floating, top-right, safe-area) appears after first completed task; pairs: `light↔dark`, `lavender↔lavender-dark`, `eco↔forest`, `ocean↔ocean-dark`, `silent↔silent-dark`, `amber↔amber-dark`, `high-contrast↔high-contrast-dark`; `amoled`/`cyberpunk` toggle to `light`. Theme unlock ladder front-loads dopamine (ADHD pacing): `light`+`high-contrast` from start; first completed task unlocks `dark`+`high-contrast-dark`+toggle (GiftModal + confetti); lavender pair at Ур. 2, eco/forest at 3, ocean at 4, silent at 5, amber at 8, amoled at 15, cyberpunk at 50. `GiftModal` celebrates every unlock event and level-up (confetti + motivation phrase + «N ур. до следующего подарка»). `useProgressCelebration` composable: localStorage baseline (silent on first observation, celebrates on delta). Server gate in `PATCH /me` checks `firstTaskDone` for dark themes and level for level-gated themes (403 `theme_locked`).
- **New themes** — added `ocean-dark` (deep teal), `silent-dark` (near-mono warm grey), `amber` (light cream, warm amber accent); renamed old dark `amber` → `amber-dark`; removed `cloud` theme entirely.
- **Theme picker redesign** — grouped pairs (Классика/Лаванда/Эко/Океан/Тихий/Янтарь) in 2-col mobile / 3-col desktop grid; «Светлая»/«Тёмная» variant labels; lock badges show «🎁» for first-task themes and «Ур. N» for level-gated; `amoled`/`cyberpunk` in separate Особые section.

- **Evening journal (Today)** — end-of-day "Итоги дня" card to capture what already happened. Log a task you did but never listed: `POST /daily/{date}/done` (`LogDoneEntry.title` `@maxLength(500)`) creates a `Task` as `status: done` + `completedAt: now` and an entry on the day, all in one `$transaction` — so it counts toward heatmap/streak/XP/quests exactly like a normal completion, and fires the same reward burst. Free-text day note: `DailyList.note` (nullable) + `PUT /daily/{date}/note` (`DailyNoteUpdate.note` `@maxLength(5000)`, upserts the day); `DailyListDetail` now carries `note`. Web: `useLogDoneTask` (invalidates daily/tasks/rewards/quests, calls `celebrate()`) and `useUpdateDailyNote`; `EveningJournal.vue` (done-log input + autosaving thoughts textarea with char counter, debounce + save-on-blur) slotted into `TodayPage` below the quests
- **Tauri 2 desktop (macOS)** — `apps/web/src-tauri` wraps the existing Vue app in a native window via the system WebView (no Chromium bundle); zero UI rewrite, frontend reused as-is. `tauri.conf.json`: identifier `com.takodo.app`, window 1200×820 (minWidth 380), `devUrl` :5173, `frontendDist ../dist`, `beforeDev/BuildCommand` wired to `pnpm dev`/`pnpm build`. Scripts: `tauri:dev`/`tauri:build` (web pkg), `desktop:dev`/`desktop:build` (root). App still talks to the API at `VITE_API_URL ?? http://localhost:3001` — fine on the dev machine; remote deploy + auth remain the blocker before distribution. Release `.app`/`.dmg` unsigned (Gatekeeper blocks on other Macs until an Apple Developer cert is added)
- **Voluntary self-report survey** (Profile) — `gender` (female/male), `birthDate` (full date), `timezone` (IANA id with datalist), `adhdStatus` (diagnosed/suspected/no/na); all optional, persisted via `PATCH /me`; privacy notice; `Profile`/`ProfileUpdate` contract fields bounded with `@maxLength` (gender/adhdStatus 20, birthDate 10, timezone 100, language 5) so ajv rejects overlong values
- **Feedback submission** — `Feedback` Prisma model (`kind`/`message`/`rating`/`status`, `@@index` on userId+status, `onDelete: Cascade`); `POST /feedback` (`FeedbackApi_create`, `kind` validated against review/wish/support, `message` `@maxLength(5000)`, optional 1–5 `rating`); `ProfileFeedback.vue` card (kind selector + star rating for reviews + textarea) wired to `useSubmitFeedback` with success/error toasts; `status` server-managed for the future admin triage view
- **Profile settings card** — name + language selector (ru/en); `en` falls back to `ru` strings (only `ru.json` populated); `AppLayout` syncs `locale` from `profile.language`; timezone field grouped here
- **Timezone UX** — `shared/lib/timezones.ts`: friendly `<select>` (city + live `Intl` UTC offset) replaces the raw IANA text input; auto-detects via `Intl.DateTimeFormat` and persists once when unset; timezone i18n key moved `survey` → `settings`
- **Feedback UX** — rating uses a `star` icon (filled when selected) instead of `flame`; character counter (`n / 5000`) under the message textarea
- **Layout reorg** — level ring moved from Profile → Достижения (Rewards) page; gentle note moved Profile → Today; «Награды» renamed to «Достижения» across nav, page title, and help
- **Roadmap** — deferred Admin panel & analytics entry (blocked on auth/multi-user); survey + feedback data collection noted as shipped this phase
- **`/help` page** — accordion with 11 sections (today, do-mode, tasks, frequent, quests, rewards, levels, settings, philosophy, icons guide, FAQ); all content in `ru.json` via `help.sections.*` tips arrays; `rt()` used to render i18n array items
- **ProfilePage** — «Справка» link before gentle note navigates to `/help`
- **Activity heatmap** — GitHub-style 12-week grid of daily task completions
  - `GET /rewards/heatmap` (`weeks` window default 12, max 53; client-local `date` validated within ±1 day; query windowed by `completedAt` to bound growth)
  - `computeHeatmap` domain fn: Monday-aligned columns ending on the current week's Sunday; per-day counts, `max` for intensity scaling, shielded-day flags (reuses the streak replay)
  - `ActivityHeatmap.vue` shared component: 5 intensity levels (sage), today ring, shield annotation, month labels + legend; `showLabels` toggle for compact use
  - Rendered on the Rewards page (full grid) and Today screen (compact, labels off, shown only once there's activity)
  - `useHeatmap` Pinia Colada composable, key `['rewards', 'heatmap', weeks]`; rewards cache invalidations switched from exact to prefix match so the heatmap refreshes on completion / reopen / focus / move-to-tomorrow / MIT toggle / quest claim

## [0.19.1] — 2026-06-12 · Quality audit: bug fixes and refactors

### Fixed

- **Quest UTC/local date mismatch** — quests endpoints now accept optional `?date=` (client local day, validated ±1 day of server UTC); web passes `todayDate()`; fixes 409 on visibly-done quests in timezones east of UTC
- **Stale gamification caches** — completing/reopening tasks, recording focus, moving to tomorrow and editing entries now also invalidate `['rewards']` and `['quests']`; StreakFlame, level chip and QuestPanel no longer stay stale
- **Push subscribe/unsubscribe silent failures** — mutations now check `{error}` from openapi-fetch; `requestAndSubscribe` awaits and shows error toast on failure; `unsubscribe` treats server cleanup as best-effort (410 self-heals)
- **Epic burst race on streak 21** — `RewardBurst` watch now tracks `[show, epic]` and restarts celebration on escalation; `TodayPage` streak watch requires a real transition (`prev !== undefined`) to skip initial load re-burst
- **SW cache unbounded growth** — cache writes go through `putBounded()` (60-entry cap, oldest-first eviction) under `e.waitUntil`; cache name never rotated between deploys, so hashed assets from old builds accumulated indefinitely
- **Push scheduler not stoppable** — `buildScheduler` now returns a handle with `stop()`; `server.ts` wires it to `SIGINT`/`SIGTERM` for graceful shutdown

### Refactored

- **`domain/date.ts`** — single source for `YYYY-MM-DD` conversions; three duplicated copies removed from `daily.ts`, `quests.ts`, `profile.ts`
- **`service/xp.ts`** — aggregate XP/level extracted; private copy in `profile.ts` removed
- **`ThemeSwatch.vue`** — replaces two ~80%-identical theme loops in `ProfilePage`; `toggleNotif` generic helper replaces twin morning/evening functions
- **Push scheduler** — reuses `pushEnabled()`; notification copy moved to constants; fan-out via `Promise.all`
- **`QuestClaim.tier`** — Prisma enum (was `String`); `PushSubscription.userId` indexed

## [0.19.0] — 2026-06-11 · Push notifications (VAPID Web Push)

### Added

- **`PushSubscription` Prisma model** — `endpoint` (unique), `p256dh`, `auth`; cascades on user delete
- **`User.notifMorning / notifEvening`** — boolean prefs (`@default(true)`); managed via `PATCH /me`
- **`domain/push.ts`** — `initVapid()`, `getVapidPublicKey()`, `buildPushPayload()`, `sendPushToSubscription()` (swallows 410/404 → stale-sub returns false for cleanup); VAPID keys from `process.env.VAPID_PUBLIC_KEY/PRIVATE_KEY`
- **`service/push.ts`** — `Push_getVapidKey`, `Push_subscribe` (upsert by endpoint), `Push_unsubscribe`; 503 when keys not configured; `sendPushToUser()` helper auto-deletes stale subs
- **`service/push-scheduler.ts`** — `buildScheduler(prisma)`: two `node-schedule` cron jobs (9:00 UTC morning, 20:00 UTC evening); skips gracefully when VAPID not configured
- **`/push/vapid-key`, `/push/subscribe` (POST/DELETE)** routes in contract and `app.ts`
- **`profile.notifications.*` i18n keys** — `label`, `sub`, `morning/morningHint`, `evening/eveningHint`, `enableCta`, `disableCta`, `permissionBlocked`, `unsupported`, `requesting`
- **`shared/api/push.ts`** (`useNotifications` composable) — permission request, `urlBase64ToUint8Array`, `requestAndSubscribe()`, `unsubscribe()`; module-level singletons for `permissionState` and `isSubscribed`
- **Profile page notifications section** — bell icon card; enable-push button (Notification.requestPermission flow); morning/evening toggle switches (ARIA role=switch); disable button; hides when permission blocked or browser unsupported
- **`.env.example`** — `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` placeholders with generation hint

### Changed

- **`Profile` contract model** — added `notifMorning: boolean` and `notifEvening: boolean` fields
- **`ProfileUpdate` contract model** — added optional `notifMorning?: boolean` and `notifEvening?: boolean`
- **`Me_get` handler** — returns `notifMorning` and `notifEvening`
- **`Me_update` handler** — accepts and persists `notifMorning` / `notifEvening`

## [0.18.0] — 2026-06-11 · PWA shell

### Added

- **`manifest.webmanifest`** (`public/`) — `name`, `short_name`, `start_url: /today`, `display: standalone`, `theme_color: #7c9a92`, `background_color: #0d0d0d` (AMOLED); SVG icon with `purpose: any maskable`; `/today` shortcut
- **`sw.js`** (`public/`) — ~30-line hand-rolled service worker: `install` precaches `/` + `skipWaiting`; `activate` clears stale caches + `clients.claim()`; `fetch` skips cross-origin, SPA navigation fallback to cached `/`, cache-first for static assets
- **PWA meta tags in `index.html`** — `<link rel="manifest">`, `theme-color`, `apple-touch-icon`, `apple-mobile-web-app-*` tags for iOS
- **SW registration** — inline script in `index.html` on `load` event
- **`pwa.spec.ts`** (`src/test/`) — 16 tests: manifest fields, sw.js event handlers, index.html wiring; typed under `tsconfig.node.json` (Node types)

## [0.17.0] — 2026-06-11 · Comeback: anti-shame return banner

### Added

- **`comeback.ts`** (`domain/`) — `gapDays(lastActiveDay, today)` counts full missed days strictly before today; `isComeback(gap)` threshold ≥ 2; `COMEBACK_MIN_GAP_DAYS` constant
- **`RewardsSummary.comebackDays?`** in contract — optional field present only in comeback state (≥ 2 missed days)
- **`selectDailyQuests(userId, date, ensureEasy?)`** — third param force-includes `complete_1` (easiest quest) when comeback is active; determinism and uniqueness preserved; stable within the day (based on completions before today)
- **`ComebackBanner.vue`** (`pages/today/ui/`) — anti-shame gain-framing card above summary ("С возвращением!", "Перерывы — это нормально…"); dismissible with accessible ×; shown when `rewards.comebackDays >= 2`
- **`comeback.*` i18n keys** — `title`, `message`, `dismissAria` in `ru.json`
- **`quests service`** — detects comeback via `task.findFirst` (last done before today); uses `ensureEasy` so quest list and claim endpoint agree on today's set

## [0.16.0] — 2026-06-11 · Daily quests with tier rewards

### Added

- **`quests.ts`** (`domain/`) — `QUEST_POOL` (6 defs: `complete_1/2/3`, `complete_mit`, `add_3`, `before_noon`); `selectDailyQuests(userId, date)` deterministic via FNV-1a hash → mulberry32 PRNG; `questProgress`, `rollTier` (70 % common / 25 % rare / 5 % epic), `TIER_XP` (10 / 25 / 50)
- **`QuestClaim` Prisma model** — `unique [userId, date, questId]`; `onDelete: Cascade` on User relation
- **`GET /quests`** — today's 3 deterministic quests with live progress and claim state
- **`POST /quests/:id/claim`** — server validates progress inside `$transaction`; rolls tier with `Math.random()`; returns 404 (not in today set), 409 `quest_not_done` / `already_claimed` (P2002 race covered)
- **`questXp`** fifth param in `computeRewards` — `questClaim.aggregate(_sum.xp)` added to rewards service
- **`useQuests`, `useClaimQuest`** composables (`shared/api/quests.ts`) — invalidate `['quests']` + `['rewards']` on settle
- **`QuestPanel.vue`** (`pages/today/ui/`) — per-quest status circle (claimed sage / done apricot / pending tint), progress text, tier badge `TIER_CLASS`, claim button; TIER colours common/rare/epic
- **`quests.*` i18n keys** — title, claim, claimed (`{tier} · +{xp} XP`), progress, tier names, 6 quest item strings
- **`Quest`, `QuestTier` enum** in TypeSpec contract; `comebackDays?` pre-wired in `RewardsSummary`

## [0.15.0] — 2026-06-11 · Theme unlock by level

### Added

- **`unlocks.ts`** (`domain/` api + `shared/lib/` web) — `THEME_UNLOCK_LEVELS` map (12 themes, levels 1–5); `themeUnlockLevel(theme)` → `POSITIVE_INFINITY` for unknown; `isThemeUnlocked(theme, level)` — web mirror marked "server is the source of truth"
- **Server-side theme validation in `PATCH /me`** — skips level query for level-1 themes; returns 403 `{ code: theme_locked }` otherwise; `ProfileUpdate.theme` doc-comment updated in TypeSpec
- **`lock` icon** in shared icon registry — padlock SVG path
- **Theme lock UI in `ProfilePage.vue`** — locked themes get `:disabled`, `opacity-50` swatch, lock badge (`data-test="theme-lock"`), caption shows `"Ур. N"` (`profile.theme.lockedLevel`) + aria `profile.theme.lockedAria`; `selectTheme` guards on `isLocked`
- **`ProfilePage.spec.ts`** — 8 tests covering locked/unlocked theme display and guard

## [0.14.0] — 2026-06-11 · XP and levels

### Added

- **`computeXP(tasks, mitCompletions)`** — `done×10 + MIT×5 + pomodoro×5`
- **`computeLevel(xp)`** — `floor(sqrt(xp / 100)) + 1` (level 1 at 0 XP, level 2 at 100, etc.)
- **`xp` + `level` fields** in `RewardsSummary` contract model
- **Level chip** on Today summary card (`data-test="level-chip"`; `bg-cat-mauve/15`; shown when `level > 1`)
- **Level display** on Rewards page — XP bar (visual fill) + level number

## [0.13.0] — 2026-06-11 · Gentle badge and move-to-tomorrow

### Added

- **`POST /daily/:date/entries/:entryId/move-to-tomorrow`** — atomic move: removes entry from today, creates/updates tomorrow's daily list, adds entry; increments `User.gentleMoves` counter
- **`User.gentleMoves`** field in Prisma schema + contract (`int @default(0)`)
- **`gentle_mode` badge** — earned when `gentleMoves >= 3`; `remaining` field tracks progress
- **`useMoveToTomorrow`** composable (`shared/api/daily.ts`) — invalidates `['daily', today]` + `['daily', tomorrow]` + `['rewards']`
- **Move-to-tomorrow arrow button** on `TodayTaskCard` — calls `useMoveToTomorrow`, shows `today.movedTomorrow` success toast

## [0.12.0] — 2026-06-11 · Streak shields

### Added

- **Shield-aware `replayStreak`** in `rewards.ts` — earns 1 shield every 5 consecutive active days (cap 2); consumes shield instead of breaking streak on missed days; `shieldedDays: Set<string>` tracked for week display
- **`shields` + `shieldUsedRecently` fields** in `RewardsSummary` contract + domain
- **`StreakFlame.vue`** (`shared/ui/streak-flame/`) — streak number + flame icon; shield indicator badge when `shields > 0`; shield-used-recently subtle glow; accessible via `aria-label`
- **Epic burst on streak 21** — `celebrate({ epic: true })` watcher in `TodayPage`; `RewardBurst` gains `fireFireworks` epic variant
- **`streak.*` + `shields.*` i18n keys** in `ru.json`

## [0.11.0] — 2026-06-11 · Pomodoro timer with focus tracking

### Added

- **`PomodoroTimer.vue`** (`shared/ui/pomodoro-timer/`) — 25-minute conic-gradient ring timer; start / pause / reset controls; apricot fill + water-ripple pulse animation on completion (respects `prefers-reduced-motion`); Web Audio chime (`shared/lib/chime.ts`) + `navigator.vibrate` on finish; theme-aware via `--sage` / `--apricot` tokens
- **`usePomodoro`** composable (`shared/lib/usePomodoro.ts`) — timestamp-delta ticking (survives tab throttle); `onFlush` / `onComplete` callbacks; flushes on pause, reset, completion, and unmount; tracks flushed seconds to avoid double-sending
- **`shared/lib/chime.ts`** — lazy `AudioContext` two-note sine chime (880 → 1318 Hz); no-op guard when API absent
- **`shared/lib/formatFocus.ts`** — `formatFocusDuration(seconds, t)` → "25 мин" / "1 ч 5 мин"
- **`tomato` icon** in shared icon registry — stroke-style: circle body, stem, two leaves
- **`POST /tasks/:id/focus`** endpoint — atomically increments `focusSeconds`; sets `pomodoro: true` → increments `pomodoros`; validates `seconds` range `1–7200`
- **`focusSeconds` + `pomodoros` fields** on `Task` model (contract + Prisma schema, `@default(0)`)
- **`useRecordFocus`** composable (`shared/api/tasks.ts`) — silent background mutation; `onSettled` invalidates `['tasks']` prefix, propagating to all surfaces
- **Focus stats in 3 surfaces:**
  - `DoPage` — `PomodoroTimer` rendered below task title; `:key="currentTask.id"` forces remount + flush on task change
  - `TodayTaskCard` — small focus badge (timer icon + duration) when `focusSeconds > 0`
  - `TaskDetailPage` — focus stats row (timer icon + duration + tomato icons) when task has any focus data
- **Tomato icons instead of text counter** — up to 5 `🍅`-style icons in apricot token color; `+N` overflow label; `aria-label` with plural form for screen readers

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

[Unreleased]: https://github.com/radislaw/takodo/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/radislaw/takodo/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/radislaw/takodo/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/radislaw/takodo/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/radislaw/takodo/releases/tag/v0.1.0
