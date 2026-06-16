/**
 * Token storage seam over localStorage. Kept framework-free so a Tauri/mobile
 * secure-store backend can swap in later without touching callers.
 */
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

const ACCESS_KEY = 'takodo.accessToken'
const REFRESH_KEY = 'takodo.refreshToken'

function store(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function getTokens(): AuthTokens | null {
  const s = store()
  const accessToken = s?.getItem(ACCESS_KEY)
  const refreshToken = s?.getItem(REFRESH_KEY)
  if (!accessToken || !refreshToken) return null
  return { accessToken, refreshToken }
}

export function setTokens(tokens: AuthTokens): void {
  const s = store()
  s?.setItem(ACCESS_KEY, tokens.accessToken)
  s?.setItem(REFRESH_KEY, tokens.refreshToken)
}

export function clearTokens(): void {
  const s = store()
  s?.removeItem(ACCESS_KEY)
  s?.removeItem(REFRESH_KEY)
}

export function hasSession(): boolean {
  return getTokens() !== null
}
