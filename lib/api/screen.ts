import { supabaseFunctionHeaders, SUPABASE_URL } from '@/lib/api/supabase-functions'
import type { VenueScreen, VenueScreenMode } from '@/lib/types/venue-screen'

export type ScreenApiResult =
  | { success: true; screen: VenueScreen }
  | { success: false; error: string; message?: string }

async function parseScreenResponse(res: Response): Promise<ScreenApiResult> {
  const text = await res.text()
  let body: Record<string, unknown>
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {}
  } catch {
    return {
      success: false,
      error: 'invalid_server_response',
      message: 'Server returned a non-JSON response.',
    }
  }

  if (body.success === true && body.screen && typeof body.screen === 'object') {
    return { success: true, screen: body.screen as VenueScreen }
  }

  return {
    success: false,
    error: typeof body.error === 'string' ? body.error : `HTTP ${res.status}`,
    message: typeof body.message === 'string' ? body.message : undefined,
  }
}

/** Staff write — always returns the updated row or an explicit error (never ambiguous empty success). */
export async function setVenueScreenMode(input: {
  screen_slug: string
  active_mode: VenueScreenMode
}): Promise<ScreenApiResult> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/screen`, {
    method: 'POST',
    headers: supabaseFunctionHeaders(),
    body: JSON.stringify({ action: 'set_mode', ...input }),
  })

  return parseScreenResponse(res)
}

/** Link a matchplay event and switch screen to Social Night mode. */
export async function setVenueScreenSocialNight(input: {
  screen_slug: string
  active_matchplay_event_id: string
}): Promise<ScreenApiResult> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/screen`, {
    method: 'POST',
    headers: supabaseFunctionHeaders(),
    body: JSON.stringify({ action: 'set_social_night', ...input }),
  })

  return parseScreenResponse(res)
}

/** Link a live match and switch screen to Showcase Game mode. */
export async function setVenueScreenShowcaseGame(input: {
  screen_slug: string
  active_showcase_match_id: string
}): Promise<ScreenApiResult> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/screen`, {
    method: 'POST',
    headers: supabaseFunctionHeaders(),
    body: JSON.stringify({ action: 'set_showcase_game', ...input }),
  })

  return parseScreenResponse(res)
}
