'use client'

import { useEffect, type CSSProperties } from 'react'

import { PalaLiveModeWaiting } from '@/components/palalive/PalaLiveModeWaiting'
import { PalaLiveShowcaseEndgameView } from '@/components/palalive/PalaLiveShowcaseEndgameView'
import { PalaLiveShowcaseView } from '@/components/palalive/PalaLiveShowcaseView'
import { useLiveMatch } from '@/lib/hooks/useLiveMatch'
import { LIVE_MATCH_FULL_SELECT } from '@/lib/live-match-select'
import { useSpectatorEndgame } from '@/lib/hooks/useSpectatorEndgame'
import { SHOWCASE_VENUE_ENDGAME_HOLD_MS } from '@/lib/showcase-timing'
import type { MatchState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'

interface PalaLiveShowcaseProps {
  courtId: string
  matchId: string
  displayName: string
  branding: VenueBranding | null
  brandingStyles?: CSSProperties
}

/**
 * setup and in_progress share one live UI. Completed matches hold briefly on
 * PalaLiveShowcaseEndgameView (same shell / bottom bar as live).
 */
export function PalaLiveShowcase({ courtId, matchId, displayName, branding, brandingStyles }: PalaLiveShowcaseProps) {
  // Scoped to the staff-selected match, not just "any match finishing on this court" —
  // otherwise an unrelated match on the same court completing would hijack the screen.
  const endgameMatch = useSpectatorEndgame(courtId, { displayMs: SHOWCASE_VENUE_ENDGAME_HOLD_MS, matchId })

  const { match, isLoading, error } = useLiveMatch<MatchState>(courtId, {
    select: LIVE_MATCH_FULL_SELECT,
    statusFilter: ['setup', 'in_progress'],
    pollInterval: 5000,
    matchId,
  })

  // Keep-alive: touch document.title periodically to prevent TV screensaver/sleep on an
  // always-on venue display. Depend on a stable boolean, not the match objects themselves —
  // those get a new reference on every poll/Realtime tick (more often than 30s during a
  // live match), which would tear down and recreate the interval before it ever fires.
  const hasContent = Boolean(match) || Boolean(endgameMatch)
  useEffect(() => {
    if (!hasContent) return
    const interval = setInterval(() => {
      if (typeof document !== 'undefined') {
        document.title = 'Showcase - PalaLive'
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [hasContent])

  if (endgameMatch) {
    return (
      <PalaLiveShowcaseEndgameView
        match={endgameMatch}
        branding={branding}
        brandingStyles={brandingStyles}
      />
    )
  }

  if (!match) {
    return (
      <PalaLiveModeWaiting
        mode="showcase_game"
        displayName={displayName}
        branding={branding}
        brandingStyles={brandingStyles}
        subtitle={
          error ? 'Connection issue — retrying…' : isLoading ? 'Loading match…' : 'Waiting for staff to start a match.'
        }
      />
    )
  }

  return <PalaLiveShowcaseView match={match} branding={branding} brandingStyles={brandingStyles} />
}
