import schedule from 'node-schedule'
import type { PrismaClient } from '@prisma/client'
import { initVapid } from '../domain/push.js'
import { sendPushToUser, pushEnabled } from './push.js'

const VAPID_SUBJECT = 'mailto:hello@tootoo.app'

// 9:00 AM UTC every day
const MORNING_CRON = '0 9 * * *'
// 8:00 PM UTC every day
const EVENING_CRON = '0 20 * * *'

// Notification copy (Russian — MVP product language). Web i18n does not reach
// the server, so the strings live here as constants until locales do.
const MORNING_BODY = 'Что сегодня в фокусе? Выгрузи мысли и выбери главное.'
const EVENING_BODY = 'Как прошёл день? Отметь сделанное и запланируй завтра.'

export interface SchedulerHandle {
  /** Cancels the cron jobs — for graceful shutdown and to keep re-registration safe. */
  stop: () => void
}

export function buildScheduler(prisma: PrismaClient): SchedulerHandle {
  initVapid(VAPID_SUBJECT)

  const jobs = [
    schedule.scheduleJob(MORNING_CRON, () =>
      sendToOptedIn(prisma, 'notifMorning', MORNING_BODY, 'morning'),
    ),
    schedule.scheduleJob(EVENING_CRON, () =>
      sendToOptedIn(prisma, 'notifEvening', EVENING_BODY, 'evening'),
    ),
  ]

  return {
    stop: () => {
      for (const job of jobs) job.cancel()
    },
  }
}

/** Never throws: an unhandled rejection inside a cron job would crash the process. */
async function sendToOptedIn(
  prisma: PrismaClient,
  pref: 'notifMorning' | 'notifEvening',
  body: string,
  tag: string,
): Promise<void> {
  try {
    if (!pushEnabled()) return
    const users = await prisma.user.findMany({ where: { [pref]: true } })
    // sendPushToUser never throws — safe to fan out.
    await Promise.all(users.map((user) => sendPushToUser(prisma, user.id, 'tootoo', body, tag)))
  } catch (error) {
    console.error(`Push cron job (${tag}) failed:`, error)
  }
}
