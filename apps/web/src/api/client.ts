import createClient from 'openapi-fetch'

import type { paths } from '../../../../packages/contract/openapi/types.gen'
import { getTokens, setTokens, clearTokens } from '@/shared/lib/authStorage'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

function isAuthRoute(url: string): boolean {
  return new URL(url, API_BASE_URL).pathname.startsWith('/auth/')
}

// Single-flight refresh: concurrent 401s share one refresh round-trip.
let refreshInFlight: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  const tokens = getTokens()
  if (!tokens) return false
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      })
      if (!res.ok) {
        clearTokens()
        return false
      }
      const pair = (await res.json()) as { accessToken: string; refreshToken: string }
      setTokens({ accessToken: pair.accessToken, refreshToken: pair.refreshToken })
      return true
    } catch {
      clearTokens()
      return false
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

function redirectToLogin(): void {
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.assign(`/login?redirect=${redirect}`)
  }
}

/** Attach the bearer token; on 401, refresh once and retry, else bounce to /login. */
const authFetch: typeof fetch = async (input, init) => {
  const base = new Request(input as RequestInfo, init)
  const authRoute = isAuthRoute(base.url)

  const withBearer = (token?: string): Request => {
    const req = base.clone()
    if (token && !authRoute) req.headers.set('authorization', `Bearer ${token}`)
    return req
  }

  const tokens = getTokens()
  let res = await fetch(withBearer(tokens?.accessToken))

  if (res.status === 401 && !authRoute && tokens) {
    const refreshed = await refreshSession()
    if (refreshed) {
      res = await fetch(withBearer(getTokens()?.accessToken))
    } else {
      redirectToLogin()
    }
  }

  return res
}

export const apiClient = createClient<paths>({ baseUrl: API_BASE_URL, fetch: authFetch })
