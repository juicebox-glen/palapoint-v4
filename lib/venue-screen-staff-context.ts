import {
  setVenueScreenMode,
  setVenueScreenShowcaseGame,
  setVenueScreenSocialNight,
} from '@/lib/api/screen'
import { SHOWCASE_VENUE_ENDGAME_HOLD_MS } from '@/lib/showcase-timing'

const CONTEXT_KEY = 'palapoint_venue_screen_staff'

/** Pending idle resets keyed by screen slug — survives staff navigation away. */
const pendingShowcaseIdleResets = new Map<string, ReturnType<typeof setTimeout>>()

export interface VenueScreenStaffContext {
  venueSlug: string
  screenSlug: string
  pairingCode: string
  linkedEventId?: string
  linkedShowcaseMatchId?: string
}

export function pairingStorageKey(venueSlug: string): string {
  return `palapoint_staff_pairing_${venueSlug}`
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
    if (
      typeof parsed.venueSlug === 'string' &&
      typeof parsed.screenSlug === 'string' &&
      typeof parsed.pairingCode === 'string'
    ) {
      return parsed
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

/** Persist staff screen context from URL + pairing code storage when entering matchplay setup. */
export function captureVenueScreenStaffContext(params: {
  venueSlug?: string | null
  screenSlug?: string | null
  pairingCode?: string | null
}): VenueScreenStaffContext | null {
  const venueSlug = params.venueSlug?.trim()
  const screenSlug = params.screenSlug?.trim()
  if (!venueSlug || !screenSlug) return getVenueScreenStaffContext()

  const pairingCode =
    params.pairingCode?.trim() ||
    (typeof window !== 'undefined'
      ? sessionStorage.getItem(pairingStorageKey(venueSlug))?.trim()
      : undefined)

  if (!pairingCode) return getVenueScreenStaffContext()

  const ctx: VenueScreenStaffContext = { venueSlug, screenSlug, pairingCode }
  saveVenueScreenStaffContext(ctx)
  return ctx
}

/** After event start — switch venue screen to Social Night for this event. */
export async function linkVenueScreenToSocialNight(
  eventId: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = getVenueScreenStaffContext()
  if (!ctx) return { ok: true }

  const result = await setVenueScreenSocialNight({
    screen_slug: ctx.screenSlug,
    pairing_code: ctx.pairingCode,
    active_matchplay_event_id: eventId,
  })

  if (!result.success) {
    return { ok: false, error: result.message ?? result.error }
  }

  saveVenueScreenStaffContext({ ...ctx, linkedEventId: eventId })
  return { ok: true }
}

/** After event finalize — return venue screen to idle. */
export async function resetVenueScreenAfterEventEnd(eventId: string): Promise<void> {
  const ctx = getVenueScreenStaffContext()
  if (!ctx || ctx.linkedEventId !== eventId) return

  await setVenueScreenMode({
    screen_slug: ctx.screenSlug,
    pairing_code: ctx.pairingCode,
    active_mode: 'idle',
  })

  clearVenueScreenStaffContext()
}

/** After match start — switch venue screen to Showcase Game for this match. */
export async function linkVenueScreenToShowcaseGame(
  matchId: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = getVenueScreenStaffContext()
  if (!ctx) return { ok: true }

  const result = await setVenueScreenShowcaseGame({
    screen_slug: ctx.screenSlug,
    pairing_code: ctx.pairingCode,
    active_showcase_match_id: matchId,
  })

  if (!result.success) {
    return { ok: false, error: result.message ?? result.error }
  }

  saveVenueScreenStaffContext({ ...ctx, linkedShowcaseMatchId: matchId })
  return { ok: true }
}

/** After showcase match ends — return venue screen to idle. */
export async function resetVenueScreenAfterShowcaseEnd(matchId: string): Promise<void> {
  const ctx = getVenueScreenStaffContext()
  if (!ctx || ctx.linkedShowcaseMatchId !== matchId) return

  await setVenueScreenMode({
    screen_slug: ctx.screenSlug,
    pairing_code: ctx.pairingCode,
    active_mode: 'idle',
  })

  saveVenueScreenStaffContext({
    ...ctx,
    linkedShowcaseMatchId: undefined,
  })
}

/**
 * Delay venue-screen idle reset so the TV can show final scores first.
 * Timer is keyed by screen — staff can navigate away without cancelling it.
 */
export function scheduleShowcaseScreenIdleReset(
  matchId: string,
  delayMs: number = SHOWCASE_VENUE_ENDGAME_HOLD_MS
): void {
  const ctx = getVenueScreenStaffContext()
  if (!ctx || ctx.linkedShowcaseMatchId !== matchId) return

  const key = ctx.screenSlug
  const existing = pendingShowcaseIdleResets.get(key)
  if (existing) clearTimeout(existing)

  pendingShowcaseIdleResets.set(
    key,
    setTimeout(() => {
      pendingShowcaseIdleResets.delete(key)
      void resetVenueScreenAfterShowcaseEnd(matchId)
    }, delayMs)
  )
}
