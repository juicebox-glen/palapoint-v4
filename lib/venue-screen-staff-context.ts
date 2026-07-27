import {
  setVenueScreenMode,
  setVenueScreenShowcaseGame,
  setVenueScreenSocialNight,
} from '@/lib/api/screen'
import { SOCIAL_NIGHT_VENUE_ENDGAME_HOLD_MS } from '@/lib/showcase-timing'

const CONTEXT_KEY = 'palapoint_venue_screen_staff'

/** Pending idle resets keyed by screen slug — survives staff navigation away. */
const pendingIdleResets = new Map<string, ReturnType<typeof setTimeout>>()

export interface VenueScreenStaffContext {
  venueSlug: string
  screenSlug: string
  linkedEventId?: string
  linkedShowcaseMatchId?: string
}

export function formatVenueLabel(venueSlug: string): string {
  return venueSlug.charAt(0).toUpperCase() + venueSlug.slice(1).replace(/-/g, ' ')
}

export function getStaffHomeHref(): string | null {
  const ctx = getVenueScreenStaffContext()
  return ctx?.venueSlug ? `/staff/${ctx.venueSlug}` : null
}

export function saveVenueScreenStaffContext(ctx: VenueScreenStaffContext): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx))
}

export function getVenueScreenStaffContext(): VenueScreenStaffContext | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(CONTEXT_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as VenueScreenStaffContext
    if (typeof parsed.venueSlug === 'string' && typeof parsed.screenSlug === 'string') {
      return {
        venueSlug: parsed.venueSlug,
        screenSlug: parsed.screenSlug,
        linkedEventId: parsed.linkedEventId,
        linkedShowcaseMatchId: parsed.linkedShowcaseMatchId,
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

export function clearVenueScreenStaffContext(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(CONTEXT_KEY)
}

/** Persist staff screen context from URL when entering matchplay setup. */
export function captureVenueScreenStaffContext(params: {
  venueSlug?: string | null
  screenSlug?: string | null
}): VenueScreenStaffContext | null {
  const venueSlug = params.venueSlug?.trim()
  const screenSlug = params.screenSlug?.trim()
  if (!venueSlug || !screenSlug) return getVenueScreenStaffContext()

  const ctx: VenueScreenStaffContext = { venueSlug, screenSlug }
  saveVenueScreenStaffContext(ctx)
  return ctx
}

/** After event start — switch venue screen to Social Night for this event. */
export async function linkVenueScreenToSocialNight(
  eventId: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = getVenueScreenStaffContext()
  if (!ctx) {
    return { ok: false, error: 'Staff screen context missing — reopen Social Night from staff home.' }
  }

  cancelPendingScreenIdleReset(ctx.screenSlug)

  const result = await setVenueScreenSocialNight({
    screen_slug: ctx.screenSlug,
    active_matchplay_event_id: eventId,
  })

  if (!result.success) {
    return { ok: false, error: result.message ?? result.error }
  }

  saveVenueScreenStaffContext({ ...ctx, linkedEventId: eventId })
  return { ok: true }
}

/** Staff backed out of the Overview screen before the event went live — return venue screen to idle, keep pairing. */
export async function unlinkVenueScreenSocialNight(eventId: string): Promise<{ ok: boolean; error?: string }> {
  const ctx = getVenueScreenStaffContext()
  if (!ctx || ctx.linkedEventId !== eventId) return { ok: true }

  cancelPendingScreenIdleReset(ctx.screenSlug)

  const result = await setVenueScreenMode({
    screen_slug: ctx.screenSlug,
    active_mode: 'idle',
  })

  if (!result.success) {
    return { ok: false, error: result.message ?? result.error }
  }

  saveVenueScreenStaffContext({ ...ctx, linkedEventId: undefined })
  return { ok: true }
}

/** After event finalize — return venue screen to idle. */
export async function resetVenueScreenAfterEventEnd(eventId: string): Promise<void> {
  const ctx = getVenueScreenStaffContext()
  if (!ctx || ctx.linkedEventId !== eventId) return

  cancelPendingScreenIdleReset(ctx.screenSlug)

  await setVenueScreenMode({
    screen_slug: ctx.screenSlug,
    active_mode: 'idle',
  })

  clearVenueScreenStaffContext()
}

/**
 * Hold Social Night final results on the TV, then idle.
 * Keeps `active_matchplay_event_id` linked so PalaLive can show postgame.
 */
export function scheduleSocialNightScreenIdleReset(
  eventId: string,
  delayMs: number = SOCIAL_NIGHT_VENUE_ENDGAME_HOLD_MS
): void {
  const ctx = getVenueScreenStaffContext()
  if (!ctx || ctx.linkedEventId !== eventId) return

  const key = ctx.screenSlug
  cancelPendingScreenIdleReset(key)

  pendingIdleResets.set(
    key,
    setTimeout(() => {
      pendingIdleResets.delete(key)
      void resetVenueScreenAfterEventEnd(eventId)
    }, delayMs)
  )
}

/** After match start — switch venue screen to Showcase Game for this match. */
export async function linkVenueScreenToShowcaseGame(
  matchId: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = getVenueScreenStaffContext()
  if (!ctx) {
    return { ok: false, error: 'Staff screen context missing — reopen Showcase from staff home.' }
  }

  cancelPendingScreenIdleReset(ctx.screenSlug)

  const result = await setVenueScreenShowcaseGame({
    screen_slug: ctx.screenSlug,
    active_showcase_match_id: matchId,
  })

  if (!result.success) {
    return { ok: false, error: result.message ?? result.error }
  }

  saveVenueScreenStaffContext({ ...ctx, linkedShowcaseMatchId: matchId })
  return { ok: true }
}

/** After showcase match ends (or a not-yet-started match is cancelled) — return venue screen to idle. */
export async function resetVenueScreenAfterShowcaseEnd(matchId: string): Promise<{ ok: boolean; error?: string }> {
  const ctx = getVenueScreenStaffContext()
  if (!ctx || ctx.linkedShowcaseMatchId !== matchId) return { ok: true }

  cancelPendingScreenIdleReset(ctx.screenSlug)

  const result = await setVenueScreenMode({
    screen_slug: ctx.screenSlug,
    active_mode: 'idle',
  })

  if (!result.success) {
    return { ok: false, error: result.message ?? result.error }
  }

  saveVenueScreenStaffContext({
    ...ctx,
    linkedShowcaseMatchId: undefined,
  })
  return { ok: true }
}

/** Cancel a scheduled TV idle reset (Reset to Idle / starting a new mode). */
export function cancelPendingScreenIdleReset(screenSlug?: string): void {
  if (screenSlug) {
    const existing = pendingIdleResets.get(screenSlug)
    if (existing) clearTimeout(existing)
    pendingIdleResets.delete(screenSlug)
    return
  }

  for (const [key, timer] of pendingIdleResets) {
    clearTimeout(timer)
    pendingIdleResets.delete(key)
  }
}

/** @deprecated Use cancelPendingScreenIdleReset */
export const cancelPendingShowcaseIdleReset = cancelPendingScreenIdleReset
