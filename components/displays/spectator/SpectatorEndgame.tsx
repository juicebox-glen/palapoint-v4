import type { VenueBranding } from '@/lib/venue'
import type { MatchState } from '@/lib/types/match'
import GradientWaveDrift from '@/components/backgrounds/GradientWaveDrift'
import { MatchWinHero } from '@/components/shared/MatchWinHero'

import { SpectatorGameInfoBadges } from './SpectatorGameInfoBadges'
import { SpectatorHeader } from './SpectatorHeader'

interface SpectatorEndgameProps {
  match: MatchState
  branding: VenueBranding | null
  brandingStyles: React.CSSProperties
}

export function SpectatorEndgame({
  match,
  branding,
  brandingStyles,
}: SpectatorEndgameProps) {
  const courtLabel = (branding?.courtName ?? 'Court 1').toUpperCase()

  return (
    <div
      className="spectator-container spectator-container--endgame"
      style={brandingStyles}
    >
      <GradientWaveDrift />
      <SpectatorHeader branding={branding} variant="endgame" courtLabel={courtLabel} />

      <div className="spectator-endgame">
        <MatchWinHero match={match} />
      </div>

      <SpectatorGameInfoBadges match={match} />
    </div>
  )
}
