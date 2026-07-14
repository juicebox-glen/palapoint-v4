'use client'

import { useEffect, useState } from 'react'

import SpectatorDisplay from '@/components/displays/spectator/SpectatorDisplay'
import { PalaLiveIdle } from '@/components/palalive/PalaLiveIdle'
import { PalaLiveSocial } from '@/components/palalive/PalaLiveSocial'
import { ScreenModePlaceholder } from '@/components/venue-screen/ScreenModePlaceholder'
import { useVenueScreen } from '@/lib/hooks/useVenueScreen'
import { MOCK_COURT_BOOKINGS } from '@/lib/palalive/mock-bookings'
import { SHOWCASE_VENUE_ENDGAME_HOLD_MS } from '@/lib/showcase-timing'
import { brandingStylesFor, getVenueBrandingForCourtId, type VenueBranding } from '@/lib/venue'

import '@/app/styles/venue-screen.css'

interface VenueScreenDisplayProps {
  screenSlug: string
}

export function VenueScreenDisplay({ screenSlug }: VenueScreenDisplayProps) {
  const { screen, isLoading, error } = useVenueScreen(screenSlug)
  const [branding, setBranding] = useState<VenueBranding | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadBranding() {
      if (!screen?.court_id) {
        setBranding(null)
        return
      }
      const result = await getVenueBrandingForCourtId(screen.court_id)
      if (!cancelled) setBranding(result)
    }

    void loadBranding()
    return () => {
      cancelled = true
    }
  }, [screen?.court_id])

  const brandingStyles = brandingStylesFor(branding)

  if (isLoading && !screen) {
    return (
      <PalaLiveIdle
        branding={branding}
        brandingStyles={brandingStyles}
        bookings={MOCK_COURT_BOOKINGS}
      />
    )
  }

  if (error || !screen) {
    return (
      <div className="venue-screen venue-screen--error">
        <div className="venue-screen-error-inner">
          <h1>Screen not found</h1>
          <p>Check the screen URL or contact PalaPoint.</p>
        </div>
      </div>
    )
  }

  if (screen.active_mode === 'idle') {
    return (
      <PalaLiveIdle
        branding={branding}
        brandingStyles={brandingStyles}
        bookings={MOCK_COURT_BOOKINGS}
      />
    )
  }

  if (screen.active_mode === 'social_night') {
    if (screen.active_matchplay_event_id) {
      return (
        <PalaLiveSocial
          eventId={screen.active_matchplay_event_id}
          displayName={screen.display_name}
          branding={branding}
          brandingStyles={brandingStyles}
        />
      )
    }

    return (
      <ScreenModePlaceholder
        mode="social_night"
        displayName={screen.display_name}
        brandingStyles={brandingStyles}
        subtitle="Waiting for staff to select an event."
      />
    )
  }

  if (screen.active_mode === 'showcase_game') {
    if (screen.court_id && screen.active_showcase_match_id) {
      return (
        <SpectatorDisplay
          courtId={screen.court_id}
          branding={branding}
          endgameDisplayMs={SHOWCASE_VENUE_ENDGAME_HOLD_MS}
        />
      )
    }

    return (
      <ScreenModePlaceholder
        mode="showcase_game"
        displayName={screen.display_name}
        brandingStyles={brandingStyles}
        subtitle="Waiting for staff to start a match."
      />
    )
  }

  return (
    <PalaLiveIdle
      branding={branding}
      brandingStyles={brandingStyles}
      bookings={MOCK_COURT_BOOKINGS}
    />
  )
}
