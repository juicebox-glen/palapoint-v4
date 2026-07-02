import { supabase } from '@/lib/supabase'
import type { VenueScreen } from '@/lib/types/venue-screen'

const LIVE_EVENT_STATUSES = new Set(['setup', 'in_progress'])
const LIVE_MATCH_STATUSES = new Set(['setup', 'in_progress'])

export interface StaffModeResumeHints {
  socialNightLive: boolean
  showcaseLive: boolean
}

export async function fetchStaffModeResumeHints(
  screen: VenueScreen | null
): Promise<StaffModeResumeHints> {
  if (!screen) {
    return { socialNightLive: false, showcaseLive: false }
  }

  const [socialNightLive, showcaseLive] = await Promise.all([
    isSocialNightEventLive(screen),
    isShowcaseMatchLive(screen),
  ])

  return { socialNightLive, showcaseLive }
}

/** Returns event id when this screen has a live Social Night event to resume. */
export async function resolveSocialNightResumeEventId(
  screen: VenueScreen
): Promise<string | null> {
  if (screen.active_mode !== 'social_night' || !screen.active_matchplay_event_id) {
    return null
  }

  const { data, error } = await supabase
    .from('matchplay_events')
    .select('id, status')
    .eq('id', screen.active_matchplay_event_id)
    .maybeSingle()

  if (error || !data?.id || !LIVE_EVENT_STATUSES.has(data.status)) {
    return null
  }

  return data.id
}

/** Returns match id when this screen has a live Showcase Game to resume. */
export async function resolveShowcaseResumeMatchId(
  screen: VenueScreen
): Promise<string | null> {
  if (screen.active_mode !== 'showcase_game' || !screen.active_showcase_match_id) {
    return null
  }

  const { data, error } = await supabase
    .from('live_matches')
    .select('id, status')
    .eq('id', screen.active_showcase_match_id)
    .maybeSingle()

  if (error || !data?.id || !LIVE_MATCH_STATUSES.has(data.status)) {
    return null
  }

  return data.id
}

async function isSocialNightEventLive(screen: VenueScreen): Promise<boolean> {
  const eventId = await resolveSocialNightResumeEventId(screen)
  return eventId != null
}

async function isShowcaseMatchLive(screen: VenueScreen): Promise<boolean> {
  const matchId = await resolveShowcaseResumeMatchId(screen)
  return matchId != null
}
