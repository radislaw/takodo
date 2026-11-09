/**
 * Backend-less demo mode (VITE_DEMO=true): an in-browser implementation of the
 * API contract used by the static GitHub Pages build. It plugs in as the
 * `fetch` of the openapi-fetch client, so no page or composable knows about it.
 *
 * Data lives in localStorage (per browser). Business rules are a deliberately
 * small mirror of apps/api (task bubbling, quests, streaks) — not a port.
 */
import type { components } from '../../../../../packages/contract/openapi/types.gen'

type Task = components['schemas']['Task']
type TaskNode = components['schemas']['TaskNode']
type Entry = components['schemas']['DailyEntry']
type Profile = components['schemas']['Profile']
type Quest = components['schemas']['Quest']
type QuestTier = components['schemas']['QuestTier']

interface DayList {
  id: string
  date: string
  createdAt: string
  note?: string
  entries: Entry[]
}

interface DemoState {
  tasks: Task[]
  lists: Record<string, DayList>
  profile: Profile
  claims: Record<string, number> // `${date}:${questId}` -> xp
  conversations: Record<
    string,
    { id: string; createdAt: string; messages: components['schemas']['Message'][] }
  >
}

const STORAGE_KEY = 'takodo.demo.v1'

// ---------- helpers ----------

let counter = 0
function uid(): string {
  counter += 1
  return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now().toString(36)}-${counter}`
}

function localDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA').format(d)
}

function addDays(date: string, delta: number): string {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return localDate(d)
}

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').toLowerCase()
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function empty(status = 204): Response {
  return new Response(null, { status })
}

function apiError(status: number, code: string, message: string): Response {
  return json({ code, message }, status)
}

const notFound = (what: string) => apiError(404, 'not_found', `${what} not found`)

function makeTask(title: string, extra: Partial<Task> = {}): Task {
  return {
    id: uid(),
    parentId: null,
    title,
    resistanceResolved: false,
    status: 'open',
    completedAt: null,
    normalizedTitle: normalizeTitle(title),
    focusSeconds: 0,
    pomodoros: 0,
    createdAt: new Date().toISOString(),
    ...extra,
  }
}

// ---------- seed + persistence ----------

function seed(): DemoState {
  const today = localDate()
  const tasks: Task[] = []
  const add = (title: string, extra: Partial<Task> = {}) => {
    const t = makeTask(title, extra)
    tasks.push(t)
    return t
  }
  const doneAt = (daysAgo: number, hour = 10) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    d.setHours(hour, 0, 0, 0)
    return d.toISOString()
  }

  const deck = add('Подготовить презентацию для встречи', { category: 'work', estimateMinutes: 90 })
  add('Собрать тезисы', { parentId: deck.id, status: 'done', completedAt: doneAt(0, 9) })
  const slides = add('Нарисовать три слайда', { parentId: deck.id, estimateMinutes: 40 })
  add('Выбрать шаблон', { parentId: slides.id })
  add('Отправить коллегам на просмотр', { parentId: deck.id })

  const mail = add('Разобрать почту', { category: 'work', estimateMinutes: 15 })
  const water = add('Выпить воды', { category: 'health' })
  const walk = add('Прогуляться 10 минут', { category: 'health', estimateMinutes: 10 })
  add('Купить продукты', { category: 'home' })
  add('Позвонить бабушке', { category: 'self' })
  add('Разобрать полку с книгами', { category: 'home' })

  // History so the streak, heatmap and badges have something to show.
  ;[1, 2, 3, 5].forEach((ago, i) =>
    add(`Сделано ${ago} дн. назад (${i + 1})`, { status: 'done', completedAt: doneAt(ago) }),
  )

  const entry = (taskId: string, order: number, isMIT = false): Entry => ({
    id: uid(),
    taskId,
    isMIT,
    order,
  })

  return {
    tasks,
    lists: {
      [today]: {
        id: uid(),
        date: today,
        createdAt: new Date().toISOString(),
        entries: [entry(mail.id, 0, true), entry(water.id, 1), entry(walk.id, 2)],
      },
    },
    profile: {
      name: 'Демо',
      theme: 'light',
      notifMorning: false,
      notifEvening: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'ru',
    },
    claims: {},
    conversations: {},
  }
}

let state: DemoState | null = null

function load(): DemoState {
  if (state) return state
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      state = JSON.parse(raw) as DemoState
      return state
    }
  } catch {
    // storage unavailable or corrupt — fall through to a fresh seed
  }
  state = seed()
  return state
}

function save(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // in-memory only
  }
}

// ---------- task rules ----------

const childrenOf = (s: DemoState, id: string) => s.tasks.filter((t) => t.parentId === id)

function subtreeIds(s: DemoState, id: string): string[] {
  return [id, ...childrenOf(s, id).flatMap((c) => subtreeIds(s, c.id))]
}

function reopenAncestors(s: DemoState, task: Task): void {
  let parent = s.tasks.find((t) => t.id === task.parentId)
  while (parent && parent.status === 'done') {
    parent.status = 'open'
    parent.completedAt = null
    parent = s.tasks.find((t) => t.id === parent!.parentId)
  }
}

function bubbleUp(s: DemoState, task: Task): void {
  let parent = s.tasks.find((t) => t.id === task.parentId)
  while (parent && childrenOf(s, parent.id).every((c) => c.status === 'done')) {
    parent.status = 'done'
    parent.completedAt = new Date().toISOString()
    parent = s.tasks.find((t) => t.id === parent!.parentId)
  }
}

function buildTree(s: DemoState, task: Task): TaskNode {
  return { ...task, children: childrenOf(s, task.id).map((c) => buildTree(s, c)) }
}

// ---------- rewards / quests ----------

const QUEST_POOL = [
  { id: 'complete_1', kind: 'complete', target: 1 },
  { id: 'complete_2', kind: 'complete', target: 2 },
  { id: 'complete_3', kind: 'complete', target: 3 },
  { id: 'complete_mit', kind: 'complete_mit', target: 1 },
  { id: 'add_3', kind: 'add_entries', target: 3 },
  { id: 'before_noon', kind: 'complete_before_noon', target: 1 },
] as const

const TIER_XP: Record<QuestTier, number> = { common: 10, rare: 25, epic: 50 }

function hash(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const completionDate = (t: Task) => (t.completedAt ? localDate(new Date(t.completedAt)) : null)

function doneOn(s: DemoState, date: string): Task[] {
  return s.tasks.filter((t) => t.status === 'done' && completionDate(t) === date)
}

function questsFor(s: DemoState, date: string): Quest[] {
  const done = doneOn(s, date)
  const list = s.lists[date]
  const mitDone = done.filter((t) => list?.entries.some((e) => e.taskId === t.id && e.isMIT)).length
  const stats = {
    complete: done.length,
    complete_mit: mitDone,
    add_entries: list?.entries.length ?? 0,
    complete_before_noon: done.filter((t) => new Date(t.completedAt!).getHours() < 12).length,
  }
  const picked = [...QUEST_POOL]
    .sort((a, b) => hash(`${date}:${a.id}`) - hash(`${date}:${b.id}`))
    .slice(0, 3)
  return picked.map((q) => {
    const progress = Math.min(stats[q.kind], q.target)
    const r = (hash(`${date}:${q.id}:tier`) % 100) / 100
    const tier: QuestTier = r < 0.7 ? 'common' : r < 0.95 ? 'rare' : 'epic'
    const claimedXp = s.claims[`${date}:${q.id}`]
    return {
      id: q.id,
      target: q.target,
      progress,
      done: progress >= q.target,
      claimed: claimedXp !== undefined,
      tier,
      xp: TIER_XP[tier],
    }
  })
}

function rewardsSummary(s: DemoState) {
  const today = localDate()
  const done = s.tasks.filter((t) => t.status === 'done' && t.completedAt)
  const active = new Set(done.map((t) => completionDate(t)!))

  let streak = 0
  let cursor = active.has(today) ? today : addDays(today, -1)
  while (active.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  let longest = 0
  let run = 0
  const days = [...active].sort()
  days.forEach((d, i) => {
    run = i > 0 && addDays(days[i - 1]!, 1) === d ? run + 1 : 1
    longest = Math.max(longest, run)
  })

  const mitDone = Object.values(s.lists)
    .flatMap((l) => l.entries)
    .filter((e) => e.isMIT && s.tasks.find((t) => t.id === e.taskId)?.status === 'done').length
  const pomodoros = s.tasks.reduce((sum, t) => sum + t.pomodoros, 0)
  const questXp = Object.values(s.claims).reduce((sum, xp) => sum + xp, 0)
  const xp = done.length * 10 + mitDone * 5 + pomodoros * 5 + questXp

  const streakBadge = (id: string, threshold: number) => ({
    id,
    earned: longest >= threshold,
    ...(longest < threshold ? { remaining: Math.max(0, threshold - streak) } : {}),
  })

  return {
    streak,
    longestStreak: longest,
    shields: 0,
    shieldUsedRecently: false,
    week: Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i - 6)
      return { date, active: active.has(date) }
    }),
    badges: [
      { id: 'first_step', earned: done.length >= 1 },
      streakBadge('streak_5', 5),
      streakBadge('streak_7', 7),
      streakBadge('streak_21', 21),
      { id: 'gentle_mode', earned: false, remaining: 3 },
    ],
    xp,
    level: Math.floor(Math.sqrt(xp / 100)) + 1,
  }
}

// ---------- routing ----------

interface Ctx {
  s: DemoState
  p: string[] // regex capture groups (path params)
  q: URLSearchParams
  body: Record<string, unknown>
}
type Handler = (c: Ctx) => Response
type Route = [method: string, pattern: RegExp, handler: Handler]

const tokens = () => ({
  accessToken: 'demo-access',
  refreshToken: 'demo-refresh',
  expiresIn: 3600,
})

function entryResponse(c: Ctx, date: string, entryId: string) {
  const list = c.s.lists[date]
  const entry = list?.entries.find((e) => e.id === entryId)
  return { list, entry }
}

const routes: Route[] = [
  // --- auth: any credentials work in the demo ---
  ['POST', /^\/auth\/(login|signup|refresh)$/, () => json(tokens())],
  ['POST', /^\/auth\/logout$/, () => empty()],
  ['GET', /^\/auth\/([^/]+)\/start$/, () => apiError(400, 'demo', 'OAuth is disabled in the demo')],
  [
    'POST',
    /^\/auth\/([^/]+)\/callback$/,
    () => apiError(400, 'demo', 'OAuth is disabled in the demo'),
  ],

  // --- tasks ---
  ['GET', /^\/tasks$/, (c) => json(c.s.tasks)],
  [
    'POST',
    /^\/tasks$/,
    (c) => {
      const b = c.body as {
        title: string
        note?: string
        parentId?: string
        estimateMinutes?: number
        category?: Task['category']
      }
      const task = makeTask(b.title, {
        parentId: b.parentId ?? null,
        note: b.note,
        estimateMinutes: b.estimateMinutes,
        category: b.category,
      })
      c.s.tasks.push(task)
      reopenAncestors(c.s, task)
      return json(task)
    },
  ],
  [
    'GET',
    /^\/tasks\/([^/]+)$/,
    (c) => {
      const t = c.s.tasks.find((x) => x.id === c.p[0])
      return t ? json(t) : notFound('Task')
    },
  ],
  [
    'PATCH',
    /^\/tasks\/([^/]+)$/,
    (c) => {
      const t = c.s.tasks.find((x) => x.id === c.p[0])
      if (!t) return notFound('Task')
      const b = c.body as Partial<Pick<Task, 'title' | 'note' | 'estimateMinutes' | 'category'>>
      Object.assign(t, b)
      if (b.title) t.normalizedTitle = normalizeTitle(b.title)
      return json(t)
    },
  ],
  [
    'DELETE',
    /^\/tasks\/([^/]+)$/,
    (c) => {
      if (!c.s.tasks.some((x) => x.id === c.p[0])) return notFound('Task')
      const ids = new Set(subtreeIds(c.s, c.p[0]!))
      c.s.tasks = c.s.tasks.filter((t) => !ids.has(t.id))
      for (const l of Object.values(c.s.lists)) {
        l.entries = l.entries.filter((e) => !ids.has(e.taskId))
      }
      return empty()
    },
  ],
  [
    'GET',
    /^\/tasks\/([^/]+)\/tree$/,
    (c) => {
      const t = c.s.tasks.find((x) => x.id === c.p[0])
      return t ? json(buildTree(c.s, t)) : notFound('Task')
    },
  ],
  [
    'POST',
    /^\/tasks\/([^/]+)\/complete$/,
    (c) => {
      const t = c.s.tasks.find((x) => x.id === c.p[0])
      if (!t) return notFound('Task')
      const now = new Date().toISOString()
      for (const id of subtreeIds(c.s, t.id)) {
        const n = c.s.tasks.find((x) => x.id === id)!
        if (n.status !== 'done') {
          n.status = 'done'
          n.completedAt = now
        }
      }
      bubbleUp(c.s, t)
      return json(t)
    },
  ],
  [
    'POST',
    /^\/tasks\/([^/]+)\/reopen$/,
    (c) => {
      const t = c.s.tasks.find((x) => x.id === c.p[0])
      if (!t) return notFound('Task')
      for (const id of subtreeIds(c.s, t.id)) {
        const n = c.s.tasks.find((x) => x.id === id)!
        n.status = 'open'
        n.completedAt = null
      }
      reopenAncestors(c.s, t)
      return json(t)
    },
  ],
  [
    'POST',
    /^\/tasks\/([^/]+)\/resolve-resistance$/,
    (c) => {
      const t = c.s.tasks.find((x) => x.id === c.p[0])
      if (!t) return notFound('Task')
      t.resistanceResolved = true
      return json(t)
    },
  ],
  [
    'POST',
    /^\/tasks\/([^/]+)\/focus$/,
    (c) => {
      const t = c.s.tasks.find((x) => x.id === c.p[0])
      if (!t) return notFound('Task')
      const b = c.body as { seconds: number; pomodoro?: boolean }
      t.focusSeconds += b.seconds
      if (b.pomodoro) t.pomodoros += 1
      return json(t)
    },
  ],

  // --- daily lists ---
  [
    'POST',
    /^\/daily$/,
    (c) => {
      const date = (c.body as { date: string }).date
      const l = (c.s.lists[date] ??= {
        id: uid(),
        date,
        createdAt: new Date().toISOString(),
        entries: [],
      })
      return json({ id: l.id, date: l.date, createdAt: l.createdAt })
    },
  ],
  [
    'GET',
    /^\/daily\/([^/]+)$/,
    (c) => {
      const l = c.s.lists[c.p[0]!]
      return l ? json(l) : notFound('Daily list')
    },
  ],
  [
    'POST',
    /^\/daily\/([^/]+)\/done$/,
    (c) => {
      const date = c.p[0]!
      const now = new Date().toISOString()
      const task = makeTask((c.body as { title: string }).title, {
        status: 'done',
        completedAt: now,
      })
      c.s.tasks.push(task)
      const l = (c.s.lists[date] ??= { id: uid(), date, createdAt: now, entries: [] })
      const entry: Entry = { id: uid(), taskId: task.id, isMIT: false, order: l.entries.length }
      l.entries.push(entry)
      return json(entry)
    },
  ],
  [
    'POST',
    /^\/daily\/([^/]+)\/entries$/,
    (c) => {
      const l = c.s.lists[c.p[0]!]
      const taskId = (c.body as { taskId: string }).taskId
      if (!l) return notFound('Daily list')
      if (!c.s.tasks.some((t) => t.id === taskId)) return notFound('Task')
      const existing = l.entries.find((e) => e.taskId === taskId)
      if (existing) return json(existing)
      const order = l.entries.reduce((m, e) => Math.max(m, e.order), -1) + 1
      const entry: Entry = { id: uid(), taskId, isMIT: false, order }
      l.entries.push(entry)
      return json(entry)
    },
  ],
  [
    'PATCH',
    /^\/daily\/([^/]+)\/entries\/([^/]+)$/,
    (c) => {
      const { entry } = entryResponse(c, c.p[0]!, c.p[1]!)
      if (!entry) return notFound('Entry')
      const b = c.body as { isMIT?: boolean; order?: number }
      if (b.isMIT !== undefined) entry.isMIT = b.isMIT
      if (b.order !== undefined) entry.order = b.order
      return json(entry)
    },
  ],
  [
    'DELETE',
    /^\/daily\/([^/]+)\/entries\/([^/]+)$/,
    (c) => {
      const { list, entry } = entryResponse(c, c.p[0]!, c.p[1]!)
      if (!list || !entry) return notFound('Entry')
      list.entries = list.entries.filter((e) => e.id !== entry.id)
      return empty()
    },
  ],
  [
    'POST',
    /^\/daily\/([^/]+)\/entries\/([^/]+)\/move-to-tomorrow$/,
    (c) => {
      const date = c.p[0]!
      const { list, entry } = entryResponse(c, date, c.p[1]!)
      if (!list || !entry) return notFound('Entry')
      const tomorrow = addDays(date, 1)
      const next = (c.s.lists[tomorrow] ??= {
        id: uid(),
        date: tomorrow,
        createdAt: new Date().toISOString(),
        entries: [],
      })
      list.entries = list.entries.filter((e) => e.id !== entry.id)
      const moved: Entry = {
        id: uid(),
        taskId: entry.taskId,
        isMIT: false,
        order: next.entries.reduce((m, e) => Math.max(m, e.order), -1) + 1,
      }
      next.entries.push(moved)
      return json(moved)
    },
  ],
  [
    'PUT',
    /^\/daily\/([^/]+)\/note$/,
    (c) => {
      const date = c.p[0]!
      const l = (c.s.lists[date] ??= {
        id: uid(),
        date,
        createdAt: new Date().toISOString(),
        entries: [],
      })
      l.note = (c.body as { note: string }).note
      return json(l)
    },
  ],

  // --- frequent ---
  [
    'GET',
    /^\/frequent$/,
    (c) => {
      const minDays = Number(c.q.get('minDays') ?? 3)
      const days = new Map<string, { title: string; lists: Set<string> }>()
      for (const l of Object.values(c.s.lists)) {
        for (const e of l.entries) {
          const t = c.s.tasks.find((x) => x.id === e.taskId)
          if (!t || t.status !== 'open') continue
          const row = days.get(t.normalizedTitle) ?? { title: t.title, lists: new Set<string>() }
          row.lists.add(l.id)
          days.set(t.normalizedTitle, row)
        }
      }
      return json(
        [...days]
          .filter(([, v]) => v.lists.size >= minDays)
          .map(([normalizedTitle, v]) => ({
            normalizedTitle,
            title: v.title,
            undoneDays: v.lists.size,
          })),
      )
    },
  ],

  // --- profile ---
  ['GET', /^\/me$/, (c) => json(c.s.profile)],
  [
    'PATCH',
    /^\/me$/,
    (c) => {
      Object.assign(c.s.profile, c.body)
      return json(c.s.profile)
    },
  ],

  // --- quests + rewards ---
  ['GET', /^\/quests$/, (c) => json(questsFor(c.s, c.q.get('date') ?? localDate()))],
  [
    'POST',
    /^\/quests\/([^/]+)\/claim$/,
    (c) => {
      const date = c.q.get('date') ?? localDate()
      const quest = questsFor(c.s, date).find((q) => q.id === c.p[0])
      if (!quest) return notFound('Quest')
      if (!quest.done) return apiError(409, 'not_done', 'Quest is not completed yet')
      c.s.claims[`${date}:${quest.id}`] = quest.xp ?? 0
      return json({ ...quest, claimed: true })
    },
  ],
  ['GET', /^\/rewards$/, (c) => json(rewardsSummary(c.s))],
  [
    'GET',
    /^\/rewards\/heatmap$/,
    (c) => {
      const weeks = Number(c.q.get('weeks') ?? 12)
      const end = c.q.get('date') ?? localDate()
      const counts = new Map<string, number>()
      for (const t of c.s.tasks) {
        const d = completionDate(t)
        if (t.status === 'done' && d) counts.set(d, (counts.get(d) ?? 0) + 1)
      }
      const daysOut = Array.from({ length: weeks * 7 }, (_, i) => {
        const date = addDays(end, i - (weeks * 7 - 1))
        return { date, count: counts.get(date) ?? 0 }
      })
      return json({ days: daysOut, max: Math.max(0, ...daysOut.map((d) => d.count)) })
    },
  ],

  // --- AI assistant: canned (the real one needs the server + a model key) ---
  [
    'GET',
    /^\/ai\/conversations$/,
    (c) => json(Object.values(c.s.conversations).map(({ id, createdAt }) => ({ id, createdAt }))),
  ],
  [
    'POST',
    /^\/ai\/conversations$/,
    (c) => {
      const conv = { id: uid(), createdAt: new Date().toISOString(), messages: [] }
      c.s.conversations[conv.id] = conv
      return json({ id: conv.id, createdAt: conv.createdAt })
    },
  ],
  [
    'GET',
    /^\/ai\/conversations\/([^/]+)$/,
    (c) => {
      const conv = c.s.conversations[c.p[0]!]
      return conv ? json(conv) : notFound('Conversation')
    },
  ],
  [
    'DELETE',
    /^\/ai\/conversations\/([^/]+)$/,
    (c) => {
      if (!c.s.conversations[c.p[0]!]) return notFound('Conversation')
      delete c.s.conversations[c.p[0]!]
      return empty()
    },
  ],
  [
    'POST',
    /^\/ai\/conversations\/([^/]+)\/messages$/,
    (c) => {
      const conv = c.s.conversations[c.p[0]!]
      if (!conv) return notFound('Conversation')
      const now = new Date().toISOString()
      conv.messages.push({
        id: uid(),
        role: 'user',
        content: (c.body as { content: string }).content,
        createdAt: now,
      })
      const assistantMessage = {
        id: uid(),
        role: 'assistant',
        content:
          'Это демо-версия: ИИ-помощник работает только на настоящем сервере. Остальное приложение — задачи, день, награды — полностью живое.',
        createdAt: now,
      }
      conv.messages.push(assistantMessage)
      return json({ assistantMessage, actions: [] })
    },
  ],

  // --- feedback + push ---
  [
    'POST',
    /^\/feedback$/,
    (c) => {
      const b = c.body as { kind: string; message: string; rating?: number }
      return json({ id: uid(), status: 'received', createdAt: new Date().toISOString(), ...b })
    },
  ],
  ['GET', /^\/push\/vapid-key$/, () => apiError(501, 'demo', 'Push is disabled in the demo')],
  ['POST', /^\/push\/subscribe$/, () => empty()],
  ['DELETE', /^\/push\/subscribe$/, () => empty()],
]

export const demoFetch: typeof fetch = async (input, init) => {
  const req = new Request(input as RequestInfo, init)
  const url = new URL(req.url)
  let body: Record<string, unknown> = {}
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    try {
      body = (await req.json()) as Record<string, unknown>
    } catch {
      // no / invalid JSON body
    }
  }

  const s = load()
  for (const [method, pattern, handler] of routes) {
    if (method !== req.method) continue
    const m = pattern.exec(url.pathname)
    if (!m) continue
    const res = handler({ s, p: m.slice(1), q: url.searchParams, body })
    if (req.method !== 'GET') save()
    return res
  }
  return apiError(404, 'not_found', `No demo route for ${req.method} ${url.pathname}`)
}

/** Drop the persisted demo data (next request re-seeds). */
export function resetDemoData(): void {
  state = null
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
