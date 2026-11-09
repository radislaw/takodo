/**
 * Operation-layer error: a domain/ownership/validation failure raised by an op
 * (`apps/api/src/ops/*`). HTTP handlers map it to a status via `sendOpError`;
 * AI tools turn it into a `tool_result` the model can react to. Ops never touch
 * `FastifyReply` — they throw this instead.
 */
export class OpError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'OpError'
  }
}

export function notFound(message: string): OpError {
  return new OpError('not_found', 404, message)
}

export function mitLimit(message: string): OpError {
  return new OpError('mit_limit', 400, message)
}
