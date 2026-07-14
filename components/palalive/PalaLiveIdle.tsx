import type { CSSProperties } from 'react'

import { BookingCard } from '@/components/palalive/BookingCard'
import { PalaLiveClock } from '@/components/palalive/PalaLiveClock'
import { PalaLiveShell } from '@/components/palalive/PalaLiveShell'
import { PalaLiveWeatherStub } from '@/components/palalive/PalaLiveWeatherStub'
import { MOCK_COURT_BOOKINGS } from '@/lib/palalive/mock-bookings'
import type { CourtBooking } from '@/lib/palalive/types'
import type { VenueBranding } from '@/lib/venue'

import '@/app/styles/palalive-idle.css'

interface PalaLiveIdleProps {
  branding: VenueBranding | null
  brandingStyles?: CSSProperties
  bookings?: CourtBooking[]
}

export function PalaLiveIdle({ branding, brandingStyles, bookings = MOCK_COURT_BOOKINGS }: PalaLiveIdleProps) {
  const availableCount = bookings.filter((booking) => booking.is_available_now).length

  return (
    <PalaLiveShell
      branding={branding}
      brandingStyles={brandingStyles}
      stageClassName="palalive-stage--idle"
      bottomBarRight={
        <>
          <PalaLiveWeatherStub />
          <PalaLiveClock />
        </>
      }
      mainStage={
        <div className="palalive-panel-stack--bookings">
          <div className="palalive-stack-header">
            <span className="palalive-title-label">Bookings</span>
            <span className="palalive-title-count">
              {availableCount} / {bookings.length} Free
            </span>
          </div>
          {bookings.map((booking) => (
            <BookingCard key={`${booking.court_number}-${booking.next_booking_start}`} booking={booking} />
          ))}
        </div>
      }
    />
  )
}
