import "@typespec/http";

using Http;

/**
 * TakoDo API — the single source of truth contract.
 * Scope: Phase 0.4 — single-user, no auth.
 * Changes happen only here → regen OpenAPI/types. Do not edit generated output by hand.
 */
@service(#{ title: "TakoDo API" })
namespace Takodo;

// ─── Enums ──────────────────────────────────────────────────────

enum TaskStatus {
  open,
  done,
}

enum TaskCategory {
  home,
  health,
  work,
  self,
}

/** Matches data-theme attribute values in tokens.css. */
enum Theme {
  light,
  lavender,
  eco,
  ocean,
  silent,
  highContrast: "high-contrast",
  highContrastDark: "high-contrast-dark",
  dark,
  forest,
  lavenderDark: "lavender-dark",
  oceanDark: "ocean-dark",
  silentDark: "silent-dark",
  amber,
  amberDark: "amber-dark",
  cyberpunk,
  amoled,
}

// ─── Errors ─────────────────────────────────────────────────────

@error
model ApiError {
  code: string;
  message: string;
}

// ─── Tasks ──────────────────────────────────────────────────────

/** Task (read shape). Fields not client-writable are set by the server. */
model Task {
  id: string;

  /** Parent in the tree; null = root. */
  parentId: string | null;

  @maxLength(500)
  title: string;

  @maxLength(5000)
  note?: string;

  /** User pressed "I can do this" → task became an executable leaf. */
  resistanceResolved: boolean;

  /** Time estimate, minutes (CBT: externalize time). */
  estimateMinutes?: int32;

  status: TaskStatus;
  category?: TaskCategory;

  completedAt: utcDateTime | null;

  /** lower+trim of the title — used to match "frequently undone" tasks. */
  normalizedTitle: string;

  /** Accumulated focused seconds (from Pomodoro sessions). Server-set. */
  focusSeconds: int32;

  /** Completed 25-minute Pomodoros. Server-set. */
  pomodoros: int32;

  createdAt: utcDateTime;
}

/** Task with its recursive subtree (unbounded depth). */
model TaskNode {
  ...Task;
  children: TaskNode[];
}

model TaskCreate {
  @maxLength(500)
  title: string;

  @maxLength(5000)
  note?: string;

  /** Parent when splitting; absent = root task of the day. */
  parentId?: string;
  estimateMinutes?: int32;
  category?: TaskCategory;
}

model TaskUpdate {
  @maxLength(500)
  title?: string;

  @maxLength(5000)
  note?: string;

  estimateMinutes?: int32;
  category?: TaskCategory;
}

model FocusRecord {
  /** Focused seconds to add (1–7200). */
  @minValue(1)
  @maxValue(7200)
  seconds: int32;

  /** True when a full 25-min Pomodoro was completed → increments counter. */
  pomodoro?: boolean;
}

@route("/tasks")
@tag("Tasks")
interface Tasks {
  @get list(): Task[];
  @post create(@body body: TaskCreate): Task;
  @get read(@path id: string): Task | ApiError;
  @patch update(@path id: string, @body body: TaskUpdate): Task | ApiError;
  @delete del(@path id: string): void | ApiError;

  /** Full subtree of the task. */
  @route("/{id}/tree") @get tree(@path id: string): TaskNode | ApiError;

  /** Mark as done; the server bubbles up (all children done → parent done). */
  @route("/{id}/complete") @post complete(@path id: string): Task | ApiError;

  /** Return to open (server handles recursive down/up as needed). */
  @route("/{id}/reopen") @post reopen(@path id: string): Task | ApiError;

  /** "No resistance, I can do it" → resistanceResolved = true. */
  @route("/{id}/resolve-resistance") @post resolveResistance(@path id: string): Task | ApiError;

  /** Record focused time (and optionally a completed Pomodoro) on the task. */
  @route("/{id}/focus") @post recordFocus(@path id: string, @body body: FocusRecord): Task | ApiError;
}

// ─── Daily list ─────────────────────────────────────────────────

model DailyEntry {
  id: string;
  taskId: string;

  /** One of the "3 most important tasks today" (MIT). Limit of 3 is server behavior. */
  isMIT: boolean;

  order: int32;
}

model DailyList {
  id: string;
  date: plainDate;
  createdAt: utcDateTime;
}

model DailyListDetail {
  ...DailyList;
  entries: DailyEntry[];

  /** Free-text journal of the day's thoughts and events. */
  note?: string;
}

model DailyListCreate {
  date: plainDate;
}

model AddEntry {
  taskId: string;
}

model EntryUpdate {
  isMIT?: boolean;
  order?: int32;
}

/** Set the day's free-text journal note. */
model DailyNoteUpdate {
  @maxLength(5000) note: string;
}

/** Log a task that was already done but never added to the list. */
model LogDoneEntry {
  @maxLength(500) title: string;
}

@route("/daily")
@tag("Daily")
interface Daily {
  @post create(@body body: DailyListCreate): DailyList;

  /** List for a date with its entries (history = past dates). */
  @route("/{date}") @get getByDate(@path date: plainDate): DailyListDetail | ApiError;

  @route("/{date}/entries") @post addEntry(
    @path date: plainDate,
    @body body: AddEntry,
  ): DailyEntry | ApiError;

  @route("/{date}/entries/{entryId}") @patch updateEntry(
    @path date: plainDate,
    @path entryId: string,
    @body body: EntryUpdate,
  ): DailyEntry | ApiError;

  @route("/{date}/entries/{entryId}") @delete removeEntry(
    @path date: plainDate,
    @path entryId: string,
  ): void | ApiError;

  /** Move an entry from this day to tomorrow atomically. Increments the user's gentleMoves counter. */
  @route("/{date}/entries/{entryId}/move-to-tomorrow") @post moveToTomorrow(
    @path date: plainDate,
    @path entryId: string,
  ): DailyEntry | ApiError;

  /** Set the day's journal note. Creates the day if missing. */
  @route("/{date}/note") @put setNote(
    @path date: plainDate,
    @body body: DailyNoteUpdate,
  ): DailyListDetail | ApiError;

  /** Log an already-done task: creates a done task + entry on this day. Counts toward stats. */
  @route("/{date}/done") @post logDone(
    @path date: plainDate,
    @body body: LogDoneEntry,
  ): DailyEntry | ApiError;
}

// ─── Profile / Me ───────────────────────────────────────────────

model Profile {
  /** Display name used in the greeting. */
  @maxLength(100)
  name: string;

  theme: Theme;

  /** Opt-in morning reminder (~9 AM). */
  notifMorning: boolean;

  /** Opt-in evening reminder (~8 PM). */
  notifEvening: boolean;

  /** Voluntary self-report: "female" | "male". */
  @maxLength(20)
  gender?: string;

  /** Voluntary self-report birth date, ISO format "YYYY-MM-DD". */
  @maxLength(10)
  birthDate?: string;

  /** IANA timezone identifier, e.g. "Europe/Moscow". */
  @maxLength(100)
  timezone?: string;

  /** Voluntary self-report: "diagnosed" | "suspected" | "no" | "na". */
  @maxLength(20)
  adhdStatus?: string;

  /** UI language preference: "ru" | "en". */
  @maxLength(5)
  language?: string;
}

model ProfileUpdate {
  @maxLength(100)
  name?: string;

  /** Rejected with 403 `theme_locked` when the theme is not unlocked at the user's level. */
  theme?: Theme;

  notifMorning?: boolean;
  notifEvening?: boolean;

  /** "female" | "male". */
  @maxLength(20)
  gender?: string;

  /** ISO date "YYYY-MM-DD". */
  @maxLength(10)
  birthDate?: string;

  /** IANA timezone identifier. */
  @maxLength(100)
  timezone?: string;

  @maxLength(20)
  adhdStatus?: string;

  /** "ru" | "en". */
  @maxLength(5)
  language?: string;
}

@route("/me")
@tag("Profile")
interface Me {
  @get get(): Profile;
  @patch update(@body body: ProfileUpdate): Profile | ApiError;
}

// ─── Feedback ───────────────────────────────────────────────────

model FeedbackCreate {
  /** "review" | "wish" | "support". */
  kind: string;

  @maxLength(5000)
  message: string;

  /** Optional 1–5 rating (reviews). */
  @minValue(1)
  @maxValue(5)
  rating?: int32;
}

/** Feedback (read shape). Status is server-managed for the future admin triage view. */
model Feedback {
  id: string;
  kind: string;

  @maxLength(5000)
  message: string;

  rating?: int32;

  /** "new" | "read" | "resolved". */
  status: string;

  createdAt: utcDateTime;
}

@route("/feedback")
@tag("Feedback")
interface FeedbackApi {
  /** Submit feedback from the current user (review / wish / support). */
  @post create(@body body: FeedbackCreate): Feedback | ApiError;
}

// ─── Rewards ────────────────────────────────────────────────────

/** One day cell in the weekly streak strip. */
model DayActivity {
  date: plainDate;
  /** User completed at least one task that day. */
  active: boolean;
  /** Inactive day covered by a streak shield (streak preserved). */
  shielded?: boolean;
}

/** Achievement badge. Title/description live in web i18n, keyed by id. */
model Badge {
  /** Stable id → maps to localized copy on the web. */
  id: string;
  earned: boolean;
  /** Units left before earning (e.g. days remaining for a streak badge). */
  remaining?: int32;
}

model RewardsSummary {
  streak: int32;
  longestStreak: int32;
  /** Streak shields available (earned every 5 active streak days, max 2). */
  shields: int32;
  /** A shield was consumed within the last 7 days. */
  shieldUsedRecently: boolean;
  /** Last 7 days, Monday-first. */
  week: DayActivity[];
  badges: Badge[];
  /** Total experience points accumulated (done×10, MIT×5, pomodoro×5). */
  xp: int32;
  /** Current level, 1-based: level = floor(sqrt(xp/100)) + 1. */
  level: int32;

  /** Full missed days before today; present only in comeback state (>= 2). */
  comebackDays?: int32;
}

/** One day cell in the activity heatmap. */
model HeatmapDay {
  date: plainDate;
  /** Tasks completed that day. */
  count: int32;
  /** Inactive day covered by a streak shield (streak preserved). */
  shielded?: boolean;
}

/** GitHub-style activity grid, oldest→newest, Monday-aligned. */
model HeatmapSummary {
  /** Exactly weeks×7 cells, ending on the Sunday of the current week. */
  days: HeatmapDay[];
  /** Highest single-day count in the window (for intensity scaling); 0 if empty. */
  max: int32;
}

@route("/rewards")
@tag("Rewards")
interface Rewards {
  @get get(): RewardsSummary;

  /** Activity heatmap; `weeks` window (default 12), `date` is the client's local day. */
  @route("/heatmap") @get heatmap(
    @query weeks?: int32,
    @query date?: plainDate,
  ): HeatmapSummary | ApiError;
}

// ─── Daily quests ───────────────────────────────────────────────

enum QuestTier {
  common,
  rare,
  epic,
}

/** Daily quest with live progress. Title/description live in web i18n, keyed by id. */
model Quest {
  /** Stable quest definition id → maps to localized copy on the web. */
  id: string;

  target: int32;
  progress: int32;

  /** progress >= target — the quest can be claimed. */
  done: boolean;

  claimed: boolean;

  /** Rolled server-side on claim (70/25/5). */
  tier?: QuestTier;

  /** XP awarded on claim, by tier. */
  xp?: int32;
}

@route("/quests")
@tag("Quests")
interface Quests {
  /**
   * Today's three deterministic quests (hash of userId+date) with live progress.
   * `date` is the client's local day (timezones differ from server UTC);
   * must be within ±1 day of server UTC today. Defaults to server UTC today.
   */
  @get list(@query date?: plainDate): Quest[] | ApiError;

  /** Claim a completed quest: server validates progress, rolls tier, awards XP. Same `date` semantics as list. */
  @route("/{id}/claim") @post claim(@path id: string, @query date?: plainDate): Quest | ApiError;
}

// ─── Push notifications ─────────────────────────────────────────

model VapidPublicKey {
  publicKey: string;
}

model PushSubscribeBody {
  @maxLength(2048)
  endpoint: string;

  @maxLength(256)
  p256dh: string;

  @maxLength(64)
  auth: string;
}

model PushUnsubscribeBody {
  @maxLength(2048)
  endpoint: string;
}

@route("/push")
@tag("Push")
interface Push {
  /** VAPID public key for the web client to create a PushSubscription. */
  @route("/vapid-key") @get getVapidKey(): VapidPublicKey | ApiError;

  /** Register a browser PushSubscription. Idempotent (upserts by endpoint). */
  @route("/subscribe") @post subscribe(@body body: PushSubscribeBody): void | ApiError;

  /** Remove a browser PushSubscription. */
  @route("/subscribe") @delete unsubscribe(@body body: PushUnsubscribeBody): void | ApiError;
}

// ─── Frequently undone ──────────────────────────────────────────

model FrequentTask {
  normalizedTitle: string;
  title: string;

  /** In how many past days the task stayed undone. */
  undoneDays: int32;
}

@route("/frequent")
@tag("Frequent")
interface Frequent {
  /** Tasks that stayed undone in >= minDays days (matched by normalizedTitle). */
  @get list(@query minDays?: int32): FrequentTask[];
}
