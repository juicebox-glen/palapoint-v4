/** Normalised court booking shape — mock data now, Playtomic edge function later (Phase 5). */
export interface CourtBooking {
  court_name: string
  court_number: number
  next_booking_start: string // ISO datetime
  next_booking_name: string // booker name or session type
  session_type: 'private' | 'coaching' | 'club_event' | 'social_night' | 'available'
  is_available_now: boolean
  available_from?: string // ISO datetime, if currently in use
}
