'use client'

import type { VenueBranding } from '@/lib/venue'
import { brandingStylesFor } from '@/lib/venue'
import type { MatchState } from '@/lib/types/match'
import { useLiveMatch } from '@/lib/hooks/useLiveMatch'
import { useSpectatorEndgame } from '@/lib/hooks/useSpectatorEndgame'
import { LIVE_MATCH_FULL_SELECT } from '@/lib/live-match-select'
import { SpectatorIdle } from './SpectatorIdle'
import { SpectatorPregame } from './SpectatorPregame'
import { SpectatorLive } from './SpectatorLive'
import { SpectatorEndgame } from './SpectatorEndgame'

interface SpectatorDisplayProps {
  courtId: string
  branding?: VenueBranding | null
}

export default function SpectatorDisplay({
  courtId,
  branding = null,
}: SpectatorDisplayProps) {
  const endgameMatch = useSpectatorEndgame(courtId)

  const { match, isLoading, error } = useLiveMatch<MatchState>(courtId, {
    select: LIVE_MATCH_FULL_SELECT,
    statusFilter: ['setup', 'in_progress'],
    pollInterval: 5000,
  })

  const brandingStyles = brandingStylesFor(branding)

  if (endgameMatch) {
    return (
      <SpectatorEndgame
        match={endgameMatch}
        branding={branding}
        brandingStyles={brandingStyles}
      />
    )
  }

  if (isLoading) {
    return (
      <SpectatorIdle
        branding={branding}
        brandingStyles={brandingStyles}
        loading
      />
    )
  }

  if (error) {
    return (
      <div className="spectator-container" style={brandingStyles}>
        <p className="spectator-error">{error}</p>
      </div>
    )
  }

  if (!match) {
    return <SpectatorIdle branding={branding} brandingStyles={brandingStyles} />
  }

  if (match.status === 'setup') {
    return (
      <SpectatorPregame
        match={match}
        branding={branding}
        brandingStyles={brandingStyles}
      />
    )
  }

  if (match.status === 'in_progress') {
    return (
      <SpectatorLive
        match={match}
        branding={branding}
        brandingStyles={brandingStyles}
      />
    )
  }

  return (
    <div className="spectator-container" style={brandingStyles}>
      <p className="spectator-no-match">Match status unavailable</p>
    </div>
  )
}
