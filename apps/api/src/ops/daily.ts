import type { PrismaClient, DailyEntry } from '@prisma/client'
import { toDateStr, parseDate } from '../domain/date.js'
import { MIT_LIMIT, canAddMIT } from '../domain/daily.js'
import { notFound, mitLimit } from './errors.js'

/**
 * Daily-list operations shared by the HTTP handlers (`service/daily.ts`) and the
 * AI agent tools. Date params are `YYYY-MM-DD` strings; ownership is scoped via
 * the `userId_date` composite key. Multi-write ops stay inside `$transaction`.
 */

export interface EntryResponse {
  id: string
  taskId: string
  isMIT: boolean
  order: number
}

export interface DailyDetailResponse {
  id: string
  date: string
  createdAt: Date
  entries: EntryResponse[]
  note?: string
}

function toEntryResponse(entry: DailyEntry): EntryResponse {
  return { id: entry.id, taskId: entry.taskId, isMIT: entry.isMIT, order: entry.order }
}

/** Upsert the day's list so entries can be attached. No-op when it already exists. */
export async function ensureDailyList(
  prisma: PrismaClient,
  userId: string,
  date: string,
): Promise<void> {
  const dateVal = parseDate(date)
  await prisma.dailyList.upsert({
    where: { userId_date: { userId, date: dateVal } },
    create: { userId, date: dateVal },
    update: {},
  })
}

export async function getDailyByDate(
  prisma: PrismaClient,
  userId: string,
  date: string,
): Promise<DailyDetailResponse> {
  const dateVal = parseDate(date)
  const list = await prisma.dailyList.findUnique({
    where: { userId_date: { userId, date: dateVal } },
    include: {
      entries: {
        orderBy: { order: 'asc' },
        select: { id: true, taskId: true, isMIT: true, order: true },
      },
    },
  })
  if (!list) throw notFound('Daily list not found')
  return {
    id: list.id,
    date: toDateStr(list.date),
    createdAt: list.createdAt,
    entries: list.entries,
    note: list.note ?? undefined,
  }
}

export async function addEntry(
  prisma: PrismaClient,
  userId: string,
  date: string,
  taskId: string,
): Promise<EntryResponse> {
  const dateVal = parseDate(date)

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || task.userId !== userId) throw notFound('Task not found')

  const entry = await prisma.$transaction(async (tx) => {
    const list = await tx.dailyList.findUnique({
      where: { userId_date: { userId, date: dateVal } },
      include: { entries: true },
    })
    if (!list) throw notFound('Daily list not found')

    // Idempotent: a task already on this day's list is returned as-is rather than
    // duplicated. There is no DB-level unique on (dailyListId, taskId), so a retry
    // or a re-issued "add to today" (the agent's repair path) would otherwise
    // create a second entry for the same task.
    const existing = list.entries.find((e) => e.taskId === taskId)
    if (existing) return existing

    const maxOrder = list.entries.reduce((m, e) => Math.max(m, e.order), -1)
    return tx.dailyEntry.create({
      data: { dailyListId: list.id, taskId, isMIT: false, order: maxOrder + 1 },
    })
  })

  return toEntryResponse(entry)
}

export async function updateEntry(
  prisma: PrismaClient,
  userId: string,
  date: string,
  entryId: string,
  body: { isMIT?: boolean; order?: number },
): Promise<EntryResponse> {
  const dateVal = parseDate(date)

  const result = await prisma.$transaction(async (tx) => {
    const list = await tx.dailyList.findUnique({
      where: { userId_date: { userId, date: dateVal } },
      include: { entries: true },
    })
    if (!list) throw notFound('Daily list not found')

    const existingEntry = list.entries.find((e) => e.id === entryId)
    if (!existingEntry) throw notFound('Entry not found')

    // enforce MIT limit atomically with the write
    if (body.isMIT === true) {
      const othersWithMIT = list.entries.filter((e) => e.isMIT && e.id !== entryId)
      if (!canAddMIT(othersWithMIT)) {
        throw mitLimit(`MIT limit of ${MIT_LIMIT} reached`)
      }
    }

    return tx.dailyEntry.update({
      where: { id: entryId },
      data: { isMIT: body.isMIT, order: body.order },
    })
  })

  return toEntryResponse(result)
}

export async function moveToTomorrow(
  prisma: PrismaClient,
  userId: string,
  date: string,
  entryId: string,
): Promise<EntryResponse> {
  const today = parseDate(date)
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

  const newEntry = await prisma.$transaction(async (tx) => {
    // Ownership check inside the transaction — no TOCTOU window.
    const todayList = await tx.dailyList.findUnique({
      where: { userId_date: { userId, date: today } },
      include: { entries: { where: { id: entryId } } },
    })
    if (!todayList || todayList.entries.length === 0) return null
    const entry = todayList.entries[0]!

    const tomorrowList = await tx.dailyList.upsert({
      where: { userId_date: { userId, date: tomorrow } },
      create: { userId, date: tomorrow },
      update: {},
    })
    const lastEntry = await tx.dailyEntry.findFirst({
      where: { dailyListId: tomorrowList.id },
      orderBy: { order: 'desc' },
    })
    const created = await tx.dailyEntry.create({
      data: {
        dailyListId: tomorrowList.id,
        taskId: entry.taskId,
        isMIT: false,
        order: (lastEntry?.order ?? -1) + 1,
      },
    })
    await tx.dailyEntry.delete({ where: { id: entryId } })
    await tx.user.update({ where: { id: userId }, data: { gentleMoves: { increment: 1 } } })
    return created
  })

  if (!newEntry) throw notFound('Entry not found')
  return toEntryResponse(newEntry)
}
