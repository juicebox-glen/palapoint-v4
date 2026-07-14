import type { CourtBooking } from './types'

function todayAt(hours: number, minutes: number): string {
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

/** Idle preview data until the Playtomic edge function (Phase 5) supplies real bookings. */
export const MOCK_COURT_BOOKINGS: CourtBooking[] = [
  {
    court_name: 'Court 1',
    court_number: 1,
    next_booking_start: todayAt(15, 0),
    next_booking_name: 'M. Herrara',
    session_type: 'private',
    is_available_now: false,
  },
  {
    court_name: 'Court 2',
    court_number: 2,
    next_booking_start: todayAt(15, 30),
    next_booking_name: 'G. Noble',
    session_type: 'coaching',
    is_available_now: false,
  },
  {
    court_name: 'Court 3',
    court_number: 3,
    next_booking_start: todayAt(17, 0),
    next_booking_name: 'Open until 17:00',
    session_type: 'available',
    is_available_now: true,
  },
  {
    court_name: 'Court 4',
    court_number: 4,
    next_booking_start: todayAt(19, 0),
    next_booking_name: 'Thursday Night Americano',
    session_type: 'social_night',
    is_available_now: false,
  },
]
