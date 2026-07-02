'use client'

import { useEffect, useState } from 'react'

import { MatchplayBoard } from '@/components/matchplay/MatchplayBoard'
import SpectatorDisplay from '@/components/displays/spectator/SpectatorDisplay'
import { ScreenIdle } from '@/components/venue-screen/ScreenIdle'
import { ScreenModePlaceholder } from '@/components/venue-screen/ScreenModePlaceholder'
import { useVenueScreen } from '@/lib/hooks/useVenueScreen'
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
      <ScreenIdle
        branding={branding}
        brandingStyles={brandingStyles}
        loading
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
      <ScreenIdle
        branding={branding}
        brandingStyles={brandingStyles}
        venueName={branding?.venueName ?? screen.display_name}
      />
    )
  }

  if (screen.active_mode === 'social_night') {
    if (screen.active_matchplay_event_id) {
      return <MatchplayBoard eventId={screen.active_matchplay_event_id} />
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
    <ScreenIdle
      branding={branding}
      brandingStyles={brandingStyles}
      venueName={branding?.venueName ?? screen.display_name}
    />
  )
}
