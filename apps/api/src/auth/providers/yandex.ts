import { AuthError } from '../errors.js'
import type {
  AuthorizeUrlArgs,
  ExchangeArgs,
  FetchFn,
  OAuthProvider,
  OAuthUserInfo,
} from './types.js'

const AUTHORIZE_URL = 'https://oauth.yandex.ru/authorize'
const TOKEN_URL = 'https://oauth.yandex.ru/token'
const INFO_URL = 'https://login.yandex.ru/info?format=json'

export interface YandexConfig {
  clientId: string
  clientSecret: string
}

interface YandexInfo {
  id: string
  default_email?: string
  real_name?: string
  display_name?: string
  login?: string
}

/** Yandex OAuth2 (not OIDC): exchange code → access token → /info profile. */
export function createYandexProvider(
  config: YandexConfig,
  fetchFn: FetchFn = fetch,
): OAuthProvider {
  return {
    name: 'yandex',

    buildAuthorizeUrl({ state, codeChallenge, redirectUri }: AuthorizeUrlArgs): string {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      })
      return `${AUTHORIZE_URL}?${params.toString()}`
    },

    async exchangeCode({ code, codeVerifier, redirectUri }: ExchangeArgs): Promise<OAuthUserInfo> {
      const tokenRes = await fetchFn(TOKEN_URL, {
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
      if (!tokenRes.ok) {
        throw new AuthError('oauth_exchange_failed', 400, 'Yandex token exchange failed')
      }
      const token = (await tokenRes.json()) as { access_token?: string }
      if (!token.access_token) {
        throw new AuthError('oauth_exchange_failed', 400, 'Yandex response missing access_token')
      }

      const infoRes = await fetchFn(INFO_URL, {
        headers: { authorization: `OAuth ${token.access_token}` },
      })
      if (!infoRes.ok) {
        throw new AuthError('oauth_exchange_failed', 400, 'Yandex profile fetch failed')
      }
      const info = (await infoRes.json()) as YandexInfo

      return {
        providerAccountId: info.id,
        email: info.default_email ?? null,
        // Yandex only returns emails it considers confirmed.
        emailVerified: Boolean(info.default_email),
        name: info.real_name ?? info.display_name ?? info.login,
      }
    },
  }
}
