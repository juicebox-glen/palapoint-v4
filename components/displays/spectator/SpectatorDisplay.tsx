'use client'

import type { VenueBranding } from '@/lib/venue'
import type { MatchState } from '@/lib/types/match'
import { useLiveMatch } from '@/lib/hooks/useLiveMatch'
import { LIVE_MATCH_FULL_SELECT } from '@/lib/supabase/selects'
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
  const { match, isLoading, error } = useLiveMatch<MatchState>(courtId, {
    select: LIVE_MATCH_FULL_SELECT,
    statusFilter: ['setup', 'in_progress', 'completed', 'abandoned'],
    pollInterval: 5000,
  })

  const brandingStyles: React.CSSProperties = {
    '--team-a': branding?.primaryColor || '#5B6CFF',
    '--team-b': branding?.secondaryColor || '#E84A8A',
    '--brand-primary': branding?.primaryColor || '#5B6CFF',
  } as React.CSSProperties

  if (isLoading) {
    return (
      <div className="spectator-container" style={brandingStyles}>
        <p className="spectator-loading">Loading...</p>
      </div>
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
    return <SpectatorIdle branding={branding} />
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

  const showSpectatorEndgame =
    match.status === 'completed' ||
    match.status === 'abandoned' ||
    (match.winner != null && match.status !== 'in_progress')

  if (showSpectatorEndgame) {
    return (
      <SpectatorEndgame
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
