/** Auth failure carrying a stable ApiError `code` and an HTTP status. */
export class AuthError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message?: string,
  ) {
    super(message ?? code)
    this.name = 'AuthError'
  }
}
