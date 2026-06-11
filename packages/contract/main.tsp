import "@typespec/http";

using Http;

/**
 * tootoo API — the single source of truth contract.
 * Scope: Phase 0.4 — single-user, no auth.
 * Changes happen only here → regen OpenAPI/types. Do not edit generated output by hand.
 */
@service(#{ title: "tootoo API" })
namespace Tootoo;

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
  cloud,
  eco,
  ocean,
  silent,
  highContrast: "high-contrast",
  dark,
  lavenderDark: "lavender-dark",
  cyberpunk,
  amber,
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
}

// ─── Profile / Me ───────────────────────────────────────────────

model Profile {
  /** Display name used in the greeting. */
  @maxLength(100)
  name: string;

  theme: Theme;
}

model ProfileUpdate {
  @maxLength(100)
  name?: string;

  /** Rejected with 403 `theme_locked` when the theme is not unlocked at the user's level. */
  theme?: Theme;
}

@route("/me")
@tag("Profile")
interface Me {
  @get get(): Profile;
  @patch update(@body body: ProfileUpdate): Profile | ApiError;
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
}

@route("/rewards")
@tag("Rewards")
interface Rewards {
  @get get(): RewardsSummary;
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
  /** Today's three deterministic quests (hash of userId+date) with live progress. */
  @get list(): Quest[];

  /** Claim a completed quest: server validates progress, rolls tier, awards XP. */
  @route("/{id}/claim") @post claim(@path id: string): Quest | ApiError;
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
