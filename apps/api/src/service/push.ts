import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { getVapidPublicKey, isAllowedPushEndpoint, sendPushToSubscription } from '../domain/push.js'

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
      if (!isAllowedPushEndpoint(body.endpoint))
        return reply.code(400).send({
          code: 'invalid_endpoint',
          message: 'Endpoint must be an https URL of a known browser push service.',
        })
      const conflict = await prisma.$transaction(async (tx) => {
        const existing = await tx.pushSubscription.findUnique({
          where: { endpoint: body.endpoint },
        })
        if (existing && existing.userId !== userId) return true
        await tx.pushSubscription.upsert({
          where: { endpoint: body.endpoint },
          update: { p256dh: body.p256dh, auth: body.auth },
          create: { userId, endpoint: body.endpoint, p256dh: body.p256dh, auth: body.auth },
        })
        return false
      })
      if (conflict)
        return reply.code(409).send({
          code: 'endpoint_conflict',
          message: 'This endpoint is registered to another user.',
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

/**
 * Send a push to all subscriptions for a user. Stale subs (410/404) are deleted.
 * Never throws: a hard failure on one subscription must not abort the rest
 * (or crash the scheduler with an unhandled rejection).
 */
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
    try {
      const ok = await sendPushToSubscription(sub, title, body, tag)
      if (!ok) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined)
      }
    } catch (error) {
      console.error(`Push send failed for subscription ${sub.id}:`, error)
    }
  }
}
