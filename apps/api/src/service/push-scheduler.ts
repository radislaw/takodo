import schedule from 'node-schedule'
import type { PrismaClient } from '@prisma/client'
import { initVapid } from '../domain/push.js'
import { sendPushToUser } from './push.js'

const VAPID_SUBJECT = 'mailto:hello@tootoo.app'

// 9:00 AM UTC every day
const MORNING_CRON = '0 9 * * *'
// 8:00 PM UTC every day
const EVENING_CRON = '0 20 * * *'

export interface SchedulerHandle {
  /** Cancels the cron jobs — for graceful shutdown and to keep re-registration safe. */
  stop: () => void
}

export function buildScheduler(prisma: PrismaClient): SchedulerHandle {
  initVapid(VAPID_SUBJECT)

  const jobs = [
    schedule.scheduleJob(MORNING_CRON, () =>
      sendToOptedIn(
        prisma,
        'notifMorning',
        'Что сегодня в фокусе? Выгрузи мысли и выбери главное.',
        'morning',
      ),
    ),
    schedule.scheduleJob(EVENING_CRON, () =>
      sendToOptedIn(
        prisma,
        'notifEvening',
        'Как прошёл день? Отметь сделанное и запланируй завтра.',
        'evening',
      ),
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
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return
    const users = await prisma.user.findMany({ where: { [pref]: true } })
    for (const user of users) {
      await sendPushToUser(prisma, user.id, 'tootoo', body, tag)
    }
  } catch (error) {
    console.error(`Push cron job (${tag}) failed:`, error)
  }
}
