import type { FastifyRequest, FastifyReply } from 'fastify'

const notImplemented = async (_req: FastifyRequest, reply: FastifyReply) => {
  return reply.status(501).send({ code: 'not_implemented', message: 'Not yet implemented' })
}

export const stubService = {
  Tasks_list: notImplemented,
  Tasks_create: notImplemented,
  Tasks_read: notImplemented,
  Tasks_update: notImplemented,
  Tasks_del: notImplemented,
  Tasks_tree: notImplemented,
  Tasks_complete: notImplemented,
  Tasks_reopen: notImplemented,
  Tasks_resolveResistance: notImplemented,
  Tasks_recordFocus: notImplemented,
  Daily_create: notImplemented,
  Daily_getByDate: notImplemented,
  Daily_addEntry: notImplemented,
  Daily_updateEntry: notImplemented,
  Daily_removeEntry: notImplemented,
  Frequent_list: notImplemented,
  Me_get: notImplemented,
  Me_update: notImplemented,
  FeedbackApi_create: notImplemented,
  Rewards_get: notImplemented,
  Assistant_createConversation: notImplemented,
  Assistant_listConversations: notImplemented,
  Assistant_getConversation: notImplemented,
  Assistant_sendMessage: notImplemented,
  Auth_signup: notImplemented,
  Auth_login: notImplemented,
  Auth_refresh: notImplemented,
  Auth_logout: notImplemented,
  Auth_oauthStart: notImplemented,
  Auth_oauthCallback: notImplemented,
}

export type ServiceHandlers = typeof stubService
