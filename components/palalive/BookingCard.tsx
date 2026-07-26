import type { CourtBooking } from '@/lib/palalive/types'

function formatBookingTime(iso: string): string {
  const date = new Date(iso)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

interface BookingCardProps {
  booking: CourtBooking
}

export function BookingCard({ booking }: BookingCardProps) {
  return (
    <div className={`palalive-stack-card${booking.is_available_now ? ' is-available' : ''}`}>
      <div className="palalive-booking-top">
        <span className="palalive-booking-court">{booking.court_name}</span>
        <span className="palalive-booking-time">
          {booking.is_available_now ? 'Available' : formatBookingTime(booking.next_booking_start)}
        </span>
      </div>
      <div className="palalive-booking-name">{booking.next_booking_name}</div>
    </div>
  )
}
