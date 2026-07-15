'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { TvViewportCanvas } from '@/app/design-system/components/TvViewportCanvas'
import { PalaLiveIdle } from '@/components/palalive/PalaLiveIdle'
import { PalaLiveModeWaiting } from '@/components/palalive/PalaLiveModeWaiting'
import { PalaLiveShowcase } from '@/components/palalive/PalaLiveShowcase'
import { PalaLiveSocial } from '@/components/palalive/PalaLiveSocial'
import { useVenueScreen } from '@/lib/hooks/useVenueScreen'
import { MOCK_COURT_BOOKINGS } from '@/lib/palalive/mock-bookings'
import { palaLiveBrandingStylesFor, getVenueBrandingForCourtId, type VenueBranding } from '@/lib/venue'

import '@/app/styles/venue-screen.css'

interface VenueScreenDisplayProps {
  screenSlug: string
}

function VenueScreenBody({
  screenSlug,
}: {
  screenSlug: string
}) {
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

  const brandingStyles = palaLiveBrandingStylesFor(branding)

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
      <PalaLiveModeWaiting
        mode="social_night"
        displayName={screen.display_name}
        branding={branding}
        brandingStyles={brandingStyles}
        subtitle="Waiting for staff to select an event."
      />
    )
  }

  if (screen.active_mode === 'showcase_game') {
    if (screen.court_id && screen.active_showcase_match_id) {
      return (
        <PalaLiveShowcase
          courtId={screen.court_id}
          matchId={screen.active_showcase_match_id}
          displayName={screen.display_name}
          branding={branding}
          brandingStyles={brandingStyles}
        />
      )
    }

    return (
      <PalaLiveModeWaiting
        mode="showcase_game"
        displayName={screen.display_name}
        branding={branding}
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

export function VenueScreenDisplay({ screenSlug }: VenueScreenDisplayProps) {
  const searchParams = useSearchParams()
  // Real kiosk / true-pixel laptop check: /screen/dev-main?native=1
  const native = searchParams.get('native') === '1'
  // Optional tighter mockup-style shrink: /screen/dev-main?fit=0.8
  const fitParam = searchParams.get('fit')
  const comfortScale =
    fitParam != null && Number.isFinite(Number(fitParam))
      ? Math.min(Math.max(Number(fitParam), 0.4), 1)
      : 0.9

  const body = <VenueScreenBody screenSlug={screenSlug} />

  if (native) return body

  return (
    <TvViewportCanvas comfortScale={comfortScale}>
      {body}
    </TvViewportCanvas>
  )
}
