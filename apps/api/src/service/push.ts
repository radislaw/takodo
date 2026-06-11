import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { getVapidPublicKey, sendPushToSubscription } from '../domain/push.js'

type GetUserId = () => Promise<string>

function pushEnabled(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

export function buildPushHandlers(prisma: PrismaClient, getUserId: GetUserId) {
  return {
    async Push_getVapidKey(_req: FastifyRequest, reply: FastifyReply) {
      const key = getVapidPublicKey()
      if (!key)
        return reply.code(503).send({
          code: 'push_not_configured',
          message: 'Push notifications are not configured on this server.',
        })
      return { publicKey: key }
    },

    async Push_subscribe(req: FastifyRequest, reply: FastifyReply) {
      if (!pushEnabled())
        return reply.code(503).send({
          code: 'push_not_configured',
          message: 'Push notifications are not configured on this server.',
        })
      const userId = await getUserId()
      const body = req.body as { endpoint: string; p256dh: string; auth: string }
      await prisma.pushSubscription.upsert({
        where: { endpoint: body.endpoint },
        update: { p256dh: body.p256dh, auth: body.auth },
        create: { userId, endpoint: body.endpoint, p256dh: body.p256dh, auth: body.auth },
      })
      return reply.code(200).send()
    },

    async Push_unsubscribe(req: FastifyRequest, reply: FastifyReply) {
      const userId = await getUserId()
      const body = req.body as { endpoint: string }
      await prisma.pushSubscription.deleteMany({
        where: { userId, endpoint: body.endpoint },
      })
      return reply.code(200).send()
    },
  }
}

/** Send a push to all subscriptions for a user. Stale subs (410/404) are deleted. */
export async function sendPushToUser(
  prisma: PrismaClient,
  userId: string,
  title: string,
  body: string,
  tag?: string,
): Promise<void> {
  if (!pushEnabled()) return
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  for (const sub of subs) {
    const ok = await sendPushToSubscription(sub, title, body, tag)
    if (!ok) {
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined)
    }
  }
}
