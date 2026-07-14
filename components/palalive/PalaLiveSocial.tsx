'use client'

import { useEffect, type CSSProperties } from 'react'

import { PalaLiveSocialView } from '@/components/palalive/PalaLiveSocialView'
import { ScreenModePlaceholder } from '@/components/venue-screen/ScreenModePlaceholder'
import { useSocialNightEvent } from '@/lib/palalive/use-social-night-event'
import type { VenueBranding } from '@/lib/venue'

interface PalaLiveSocialProps {
  eventId: string
  displayName: string
  branding: VenueBranding | null
  brandingStyles?: CSSProperties
}

export function PalaLiveSocial({ eventId, displayName, branding, brandingStyles }: PalaLiveSocialProps) {
  const { data, loading, error } = useSocialNightEvent(eventId)

  // Keep-alive: touch document.title periodically to prevent TV screensaver/sleep
  // on an always-on venue display (same purpose as the old MatchplayBoard's interval).
  useEffect(() => {
    if (!data) return
    const interval = setInterval(() => {
      if (typeof document !== 'undefined') {
        document.title = `${data.eventName} - PalaLive`
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [data])

  if (!data) {
    return (
      <ScreenModePlaceholder
        mode="social_night"
        displayName={displayName}
        brandingStyles={brandingStyles}
        subtitle={error ?? (loading ? 'Loading event…' : 'Waiting for staff to select an event.')}
      />
    )
  }

  return <PalaLiveSocialView branding={branding} brandingStyles={brandingStyles} data={data} />
}
