'use client'

import { useEffect, type CSSProperties } from 'react'

import { PalaLiveModeWaiting } from '@/components/palalive/PalaLiveModeWaiting'
import { PalaLiveSocialView } from '@/components/palalive/PalaLiveSocialView'
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
  // Depend on the event name, not `data` itself — `data` gets a new reference on every
  // poll/Realtime tick (well under 30s during an active round), which tore down and
  // recreated the interval before it ever fired (same bug Phase 3 fixed for Showcase).
  const eventName = data?.eventName ?? null
  useEffect(() => {
    if (!eventName) return
    const interval = setInterval(() => {
      if (typeof document !== 'undefined') {
        document.title = `${eventName} - PalaLive`
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [eventName])

  if (!data) {
    return (
      <PalaLiveModeWaiting
        mode="social_night"
        displayName={displayName}
        branding={branding}
        brandingStyles={brandingStyles}
        subtitle={error ?? (loading ? 'Loading event…' : 'Waiting for staff to select an event.')}
      />
    )
  }

  return <PalaLiveSocialView branding={branding} brandingStyles={brandingStyles} data={data} />
}
