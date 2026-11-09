import { SignJWT, importPKCS8, jwtVerify, createRemoteJWKSet, type JWTVerifyGetKey } from 'jose'
import { AuthError } from '../errors.js'
import type {
  AuthorizeUrlArgs,
  ExchangeArgs,
  FetchFn,
  OAuthProvider,
  OAuthUserInfo,
} from './types.js'

const AUTHORIZE_URL = 'https://appleid.apple.com/auth/authorize'
const TOKEN_URL = 'https://appleid.apple.com/auth/token'
const JWKS_URL = 'https://appleid.apple.com/auth/keys'
const ISSUER = 'https://appleid.apple.com'

export interface AppleConfig {
  /** Service ID used as the OAuth client_id. */
  clientId: string
  teamId: string
  keyId: string
  /** Contents of the .p8 private key (PKCS8 PEM). */
  privateKey: string
}

interface AppleIdClaims {
  sub: string
  email?: string
  email_verified?: boolean | string
}

/** Apple "Sign in" provider. ES256 client_secret JWT + form_post (web relays code/state). */
export function createAppleProvider(
  config: AppleConfig,
  fetchFn: FetchFn = fetch,
  jwks: JWTVerifyGetKey = createRemoteJWKSet(new URL(JWKS_URL)),
): OAuthProvider {
  async function clientSecret(): Promise<string> {
    const key = await importPKCS8(config.privateKey, 'ES256')
    return new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: config.keyId })
      .setIssuer(config.teamId)
      .setSubject(config.clientId)
      .setAudience(ISSUER)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(key)
  }

  return {
    name: 'apple',

    buildAuthorizeUrl({ state, redirectUri }: AuthorizeUrlArgs): string {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        response_mode: 'form_post',
        scope: 'name email',
        state,
      })
      return `${AUTHORIZE_URL}?${params.toString()}`
    },

    async exchangeCode({ code, redirectUri }: ExchangeArgs): Promise<OAuthUserInfo> {
      const res = await fetchFn(TOKEN_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: config.clientId,
          client_secret: await clientSecret(),
        }),
      })
      if (!res.ok) {
        throw new AuthError('oauth_exchange_failed', 400, 'Apple token exchange failed')
      }
      const data = (await res.json()) as { id_token?: string }
      if (!data.id_token) {
        throw new AuthError('oauth_exchange_failed', 400, 'Apple response missing id_token')
      }

      let claims: AppleIdClaims
      try {
        const verified = await jwtVerify(data.id_token, jwks, {
          issuer: ISSUER,
          audience: config.clientId,
        })
        claims = verified.payload as unknown as AppleIdClaims
      } catch {
        throw new AuthError('oauth_exchange_failed', 400, 'Invalid Apple id_token')
      }

      return {
        providerAccountId: claims.sub,
        email: claims.email ?? null,
        emailVerified: claims.email_verified === true || claims.email_verified === 'true',
      }
    },
  }
}
