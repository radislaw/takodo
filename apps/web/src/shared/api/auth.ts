import { computed, ref } from 'vue'
import { useMutation } from '@pinia/colada'
import { apiClient } from '@/api/client'
import {
  getTokens,
  setTokens,
  clearTokens,
  hasSession,
  type AuthTokens,
} from '@/shared/lib/authStorage'
import { useErrorToast } from '@/shared/lib/useErrorToast'

export type OAuthProviderName = 'google' | 'yandex' | 'apple'

// The single web callback URL carries only code/state, so we stash which
// provider the flow belongs to before redirecting, and read it back on return.
const PENDING_PROVIDER_KEY = 'takodo.oauth.provider'

function setPendingProvider(provider: OAuthProviderName): void {
  try {
    window.sessionStorage.setItem(PENDING_PROVIDER_KEY, provider)
  } catch {
    /* sessionStorage unavailable — OAuth simply won't resume */
  }
}

export function consumePendingProvider(): OAuthProviderName | null {
  try {
    const value = window.sessionStorage.getItem(PENDING_PROVIDER_KEY)
    window.sessionStorage.removeItem(PENDING_PROVIDER_KEY)
    return value as OAuthProviderName | null
  } catch {
    return null
  }
}

// Module-level reactive session flag, seeded from storage.
const authed = ref(hasSession())

function applyTokens(pair: AuthTokens): void {
  setTokens(pair)
  authed.value = true
}

function dropSession(): void {
  clearTokens()
  authed.value = false
}

export function useSession() {
  return { isAuthenticated: computed(() => authed.value) }
}

export function useSignup() {
  const { showError } = useErrorToast()
  return useMutation({
    mutation: async (body: { email: string; password: string; name?: string }) => {
      const { data, error } = await apiClient.POST('/auth/signup', { body })
      if (error || !data) throw error ?? new Error('signup_failed')
      return data as AuthTokens
    },
    onSuccess: (data) => applyTokens(data),
    onError: () => showError('auth.errors.signupFailed'),
  })
}

export function useLogin() {
  const { showError } = useErrorToast()
  return useMutation({
    mutation: async (body: { email: string; password: string }) => {
      const { data, error } = await apiClient.POST('/auth/login', { body })
      if (error || !data) throw error ?? new Error('login_failed')
      return data as AuthTokens
    },
    onSuccess: (data) => applyTokens(data),
    onError: () => showError('auth.errors.loginFailed'),
  })
}

/** Revoke the refresh token server-side, drop the local session, hard-reload to /login. */
export function useLogout() {
  return useMutation({
    mutation: async () => {
      const refreshToken = getTokens()?.refreshToken
      if (refreshToken) {
        await apiClient.POST('/auth/logout', { body: { refreshToken } })
      }
    },
    onSettled: () => {
      dropSession()
      if (typeof window !== 'undefined') window.location.assign('/login')
    },
  })
}

/** Kick off an OAuth flow: fetch the authorize URL, then redirect the browser to it. */
export function useOAuthStart() {
  const { showError } = useErrorToast()
  return useMutation({
    mutation: async (provider: OAuthProviderName) => {
      setPendingProvider(provider)
      const { data, error } = await apiClient.GET('/auth/{provider}/start', {
        params: { path: { provider } },
      })
      if (error || !data) throw error ?? new Error('oauth_start_failed')
      return data
    },
    onSuccess: (data) => {
      if (typeof window !== 'undefined') window.location.assign(data.authorizeUrl)
    },
    onError: () => showError('auth.errors.oauthFailed'),
  })
}

/** Complete an OAuth flow from the callback page. */
export function useOAuthCallback() {
  return useMutation({
    mutation: async (vars: { provider: OAuthProviderName; code: string; state: string }) => {
      const { data, error } = await apiClient.POST('/auth/{provider}/callback', {
        params: { path: { provider: vars.provider } },
        body: { code: vars.code, state: vars.state },
      })
      if (error || !data) throw error ?? new Error('oauth_callback_failed')
      return data as AuthTokens
    },
    onSuccess: (data) => applyTokens(data),
  })
}
