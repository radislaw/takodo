import { jwtVerify, createRemoteJWKSet, type JWTVerifyGetKey } from 'jose'
import { AuthError } from '../errors.js'
import type {
  AuthorizeUrlArgs,
  ExchangeArgs,
  FetchFn,
  OAuthProvider,
  OAuthUserInfo,
} from './types.js'

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com']

export interface GoogleConfig {
  clientId: string
  clientSecret: string
}

interface GoogleIdClaims {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
}

/** Google OIDC provider. `jwks` is injectable for tests; defaults to Google's remote key set. */
export function createGoogleProvider(
  config: GoogleConfig,
  fetchFn: FetchFn = fetch,
  jwks: JWTVerifyGetKey = createRemoteJWKSet(new URL(JWKS_URL)),
): OAuthProvider {
  return {
    name: 'google',

    buildAuthorizeUrl({ state, codeChallenge, redirectUri }: AuthorizeUrlArgs): string {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      })
      return `${AUTHORIZE_URL}?${params.toString()}`
    },

    async exchangeCode({ code, codeVerifier, redirectUri }: ExchangeArgs): Promise<OAuthUserInfo> {
      const res = await fetchFn(TOKEN_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }),
      })
      if (!res.ok) {
        throw new AuthError('oauth_exchange_failed', 400, 'Google token exchange failed')
      }
      const data = (await res.json()) as { id_token?: string }
      if (!data.id_token) {
        throw new AuthError('oauth_exchange_failed', 400, 'Google response missing id_token')
      }

      let claims: GoogleIdClaims
      try {
        const verified = await jwtVerify(data.id_token, jwks, {
          issuer: ISSUERS,
          audience: config.clientId,
        })
        claims = verified.payload as unknown as GoogleIdClaims
      } catch {
        throw new AuthError('oauth_exchange_failed', 400, 'Invalid Google id_token')
      }

      return {
        providerAccountId: claims.sub,
        email: claims.email ?? null,
        emailVerified: claims.email_verified === true,
        name: claims.name,
      }
    },
  }
}
