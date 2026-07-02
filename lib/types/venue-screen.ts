export type VenueScreenMode = 'idle' | 'social_night' | 'showcase_game'

/** Public venue screen row (no pairing secret). */
export interface VenueScreen {
  id: string
  screen_slug: string
  venue_slug: string
  company_slug: string
  display_name: string
  court_id: string | null
  active_mode: VenueScreenMode
  active_matchplay_event_id: string | null
  active_showcase_match_id: string | null
  created_at: string
  updated_at: string
}

export const VENUE_SCREEN_PUBLIC_SELECT =
  'id, screen_slug, venue_slug, company_slug, display_name, court_id, active_mode, active_matchplay_event_id, active_showcase_match_id, created_at, updated_at'
