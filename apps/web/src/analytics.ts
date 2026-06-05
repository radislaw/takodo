export interface TrackEvent {
  type: string
  payload?: Record<string, unknown>
}

/**
 * No-op until consent flags and analytics backend are wired (Phase 1+).
 * Events are only sent when the user has granted consentAnalytics.
 */
export function track(_event: TrackEvent): void {
  // intentional no-op
}
