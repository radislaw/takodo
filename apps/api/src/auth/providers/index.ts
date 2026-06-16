import { createGoogleProvider } from './google.js'
import { createYandexProvider } from './yandex.js'
import { createAppleProvider } from './apple.js'
import type { FetchFn, OAuthProvider } from './types.js'

export type ProviderRegistry = Map<string, OAuthProvider>

/** Build the provider registry from env — only providers with full credentials are enabled. */
export function buildProviderRegistry(
  env: NodeJS.ProcessEnv = process.env,
  fetchFn?: FetchFn,
): ProviderRegistry {
  const registry: ProviderRegistry = new Map()

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    registry.set(
      'google',
      createGoogleProvider(
        { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
        fetchFn,
      ),
    )
  }

  if (env.YANDEX_CLIENT_ID && env.YANDEX_CLIENT_SECRET) {
    registry.set(
      'yandex',
      createYandexProvider(
        { clientId: env.YANDEX_CLIENT_ID, clientSecret: env.YANDEX_CLIENT_SECRET },
        fetchFn,
      ),
    )
  }

  if (env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY) {
    registry.set(
      'apple',
      createAppleProvider(
        {
          clientId: env.APPLE_CLIENT_ID,
          teamId: env.APPLE_TEAM_ID,
          keyId: env.APPLE_KEY_ID,
          privateKey: env.APPLE_PRIVATE_KEY,
        },
        fetchFn,
      ),
    )
  }

  return registry
}

export type { OAuthProvider, OAuthUserInfo } from './types.js'
