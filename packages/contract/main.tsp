import "@typespec/http";

using Http;

/**
 * tootoo API — единый контракт (источник правды).
 * Объём: Phase 0.4 — single-user, без auth.
 * Меняется только здесь → regen OpenAPI/типы. Руками сгенерированное не править.
 */
@service(#{ title: "tootoo API" })
namespace Tootoo;

// ─── Перечисления ───────────────────────────────────────────────

enum TaskStatus {
  open,
  done,
}

// ─── Ошибки ─────────────────────────────────────────────────────

@error
model ApiError {
  code: string;
  message: string;
}

// ─── Задачи ─────────────────────────────────────────────────────

/** Задача (read-форма). Поля без клиентской записи проставляет сервер. */
model Task {
  id: string;

  /** Родитель в дереве; null = корень. */
  parentId: string | null;

  title: string;
  note?: string;

  /** Пользователь нажал «могу сделать» → задача стала исполняемым листом. */
  resistanceResolved: boolean;

  /** Оценка времени, мин (КПТ: externalize time). */
  estimateMinutes?: int32;

  status: TaskStatus;

  completedAt: utcDateTime | null;

  /** lower+trim заголовка — матчинг «частых невыполненных». */
  normalizedTitle: string;

  createdAt: utcDateTime;
}

/** Задача с рекурсивным поддеревом (неограниченная глубина). */
model TaskNode {
  ...Task;
  children: TaskNode[];
}

model TaskCreate {
  title: string;
  note?: string;

  /** Родитель при дроблении; отсутствует = корневая задача дня. */
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

  /** Полное поддерево задачи. */
  @route("/{id}/tree") @get tree(@path id: string): TaskNode | ApiError;

  /** Отметить выполненной; сервер авто-bubble вверх (все дети done → родитель done). */
  @route("/{id}/complete") @post complete(@path id: string): Task | ApiError;

  /** Вернуть в open (рекурсивно вниз/вверх по необходимости — поведение сервера). */
  @route("/{id}/reopen") @post reopen(@path id: string): Task | ApiError;

  /** «Сопротивления нет, могу сделать» → resistanceResolved = true. */
  @route("/{id}/resolve-resistance") @post resolveResistance(@path id: string): Task | ApiError;
}

// ─── Дневной лист ───────────────────────────────────────────────

model DailyEntry {
  id: string;
  taskId: string;

  /** Одна из «3 главных на сегодня» (MIT). Лимит 3 — поведение сервера. */
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

  /** Лист на дату с записями (история = прошлые даты). */
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

// ─── Частые невыполненные ───────────────────────────────────────

model FrequentTask {
  normalizedTitle: string;
  title: string;

  /** В скольких прошлых днях задача осталась невыполненной. */
  undoneDays: int32;
}

@route("/frequent")
@tag("Frequent")
interface Frequent {
  /** Задачи, повторявшиеся невыполненными ≥ minDays дней (матч по normalizedTitle). */
  @get list(@query minDays?: int32): FrequentTask[];
}
