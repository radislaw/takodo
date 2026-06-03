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

  title: string;
  note?: string;

  /** User pressed "I can do this" → task became an executable leaf. */
  resistanceResolved: boolean;

  /** Time estimate, minutes (CBT: externalize time). */
  estimateMinutes?: int32;

  status: TaskStatus;

  completedAt: utcDateTime | null;

  /** lower+trim of the title — used to match "frequently undone" tasks. */
  normalizedTitle: string;

  createdAt: utcDateTime;
}

/** Task with its recursive subtree (unbounded depth). */
model TaskNode {
  ...Task;
  children: TaskNode[];
}

model TaskCreate {
  title: string;
  note?: string;

  /** Parent when splitting; absent = root task of the day. */
  parentId?: string;
  estimateMinutes?: int32;
}

model TaskUpdate {
  title?: string;
  note?: string;
  estimateMinutes?: int32;
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
