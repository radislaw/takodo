import schedule from 'node-schedule'
import type { PrismaClient } from '@prisma/client'
import { initVapid } from '../domain/push.js'
import { sendPushToUser } from './push.js'

const VAPID_SUBJECT = 'mailto:hello@tootoo.app'

// 9:00 AM UTC every day
const MORNING_CRON = '0 9 * * *'
// 8:00 PM UTC every day
const EVENING_CRON = '0 20 * * *'

export function buildScheduler(prisma: PrismaClient): void {
  initVapid(VAPID_SUBJECT)

  schedule.scheduleJob(MORNING_CRON, async () => {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return
    const users = await prisma.user.findMany({ where: { notifMorning: true } })
    for (const user of users) {
      await sendPushToUser(
        prisma,
        user.id,
        'tootoo',
        'Что сегодня в фокусе? Выгрузи мысли и выбери главное.',
        'morning',
      )
    }
  })

  schedule.scheduleJob(EVENING_CRON, async () => {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return
    const users = await prisma.user.findMany({ where: { notifEvening: true } })
    for (const user of users) {
      await sendPushToUser(
        prisma,
        user.id,
        'tootoo',
        'Как прошёл день? Отметь сделанное и запланируй завтра.',
        'evening',
      )
    }
  })
}
