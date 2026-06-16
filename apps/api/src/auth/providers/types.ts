/** Normalized identity returned by every OAuth provider after code exchange. */
export interface OAuthUserInfo {
  /** Provider-stable account id (OIDC `sub` / Yandex `id`). */
  providerAccountId: string
  email: string | null
  /** Whether the provider asserts the email is verified (gates account linking). */
  emailVerified: boolean
  name?: string
}

export interface AuthorizeUrlArgs {
  state: string
  codeChallenge: string
  redirectUri: string
}

export interface ExchangeArgs {
  code: string
  codeVerifier: string
  redirectUri: string
}

/** A wired OAuth provider: builds its authorize URL and exchanges a code for identity. */
export interface OAuthProvider {
  readonly name: string
  buildAuthorizeUrl(args: AuthorizeUrlArgs): string
  exchangeCode(args: ExchangeArgs): Promise<OAuthUserInfo>
}

/** Injectable fetch seam so provider exchanges are testable without network. */
export type FetchFn = typeof fetch
