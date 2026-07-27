'use client'

import { useEffect, useRef, type CSSProperties } from 'react'

import { PalaLiveModeWaiting } from '@/components/palalive/PalaLiveModeWaiting'
import { PalaLiveShowcaseEndgameView } from '@/components/palalive/PalaLiveShowcaseEndgameView'
import { PalaLiveShowcaseView } from '@/components/palalive/PalaLiveShowcaseView'
import { setVenueScreenMode } from '@/lib/api/screen'
import { useLiveMatch } from '@/lib/hooks/useLiveMatch'
import { LIVE_MATCH_FULL_SELECT } from '@/lib/live-match-select'
import { useSpectatorEndgame } from '@/lib/hooks/useSpectatorEndgame'
import { SHOWCASE_VENUE_ENDGAME_HOLD_MS } from '@/lib/showcase-timing'
import type { MatchState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'

interface PalaLiveShowcaseProps {
  courtId: string
  matchId: string
  screenSlug: string
  displayName: string
  branding: VenueBranding | null
  brandingStyles?: CSSProperties
}

/**
 * setup and in_progress share one live UI. Completed matches hold briefly on
 * PalaLiveShowcaseEndgameView (same shell / bottom bar as live).
 */
export function PalaLiveShowcase({ courtId, matchId, screenSlug, displayName, branding, brandingStyles }: PalaLiveShowcaseProps) {
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

  // Self-return-to-idle: this display, not the staff tab, owns telling the screen to
  // idle once there's nothing left to show for this match — whether that's after the
  // endgame hold finishes, or immediately for a match that ended without a showable
  // result. Reliable regardless of whether the staff tab that ended the match is still
  // open. Server-side no-ops if staff has since linked a newer match on this screen.
  const sawContentRef = useRef(false)
  const unlinkFiredForMatchRef = useRef<string | null>(null)
  // Reset per matchId — a fresh match linked while this component stays mounted must
  // not inherit "already saw content" from the match that was here before it.
  useEffect(() => {
    sawContentRef.current = false
    unlinkFiredForMatchRef.current = null
  }, [matchId])
  useEffect(() => {
    if (hasContent) {
      sawContentRef.current = true
      return
    }
    if (!sawContentRef.current) return
    if (unlinkFiredForMatchRef.current === matchId) return
    unlinkFiredForMatchRef.current = matchId
    void setVenueScreenMode({
      screen_slug: screenSlug,
      active_mode: 'idle',
      if_showcase_match_id: matchId,
    })
  }, [hasContent, matchId, screenSlug])

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
