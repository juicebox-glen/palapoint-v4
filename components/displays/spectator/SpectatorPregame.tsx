import type { VenueBranding } from '@/lib/venue'
import type { MatchState } from '@/lib/types/match'
import GradientWaveDrift from '@/components/backgrounds/GradientWaveDrift'
import { SpectatorGameInfoBadges } from './SpectatorGameInfoBadges'
import { SpectatorHeader } from './SpectatorHeader'
import { SpectatorPregameTeamInner } from './SpectatorPregameTeamInner'

interface SpectatorPregameProps {
  match: MatchState
  branding: VenueBranding | null
  brandingStyles: React.CSSProperties
}

export function SpectatorPregame({
  match,
  branding,
  brandingStyles,
}: SpectatorPregameProps) {
  const courtLabel = (branding?.courtName ?? 'Court 1').toUpperCase()

  return (
    <div
      className="spectator-container spectator-container--pregame"
      style={brandingStyles}
    >
      <GradientWaveDrift />
      <SpectatorHeader
        branding={branding}
        variant="pregame"
        courtLabel={courtLabel}
      />

      <div className="spectator-pregame-broadcast">
        <div className="spectator-pregame-side spectator-pregame-side-a">
          <SpectatorPregameTeamInner
            side="a"
            player1={match.team_a_player_1}
            player2={match.team_a_player_2}
            photo1={match.team_a_player_1_photo}
            photo2={match.team_a_player_2_photo}
          />
        </div>

        <div className="spectator-pregame-vs">VS</div>

        <div className="spectator-pregame-side spectator-pregame-side-b">
          <SpectatorPregameTeamInner
            side="b"
            player1={match.team_b_player_1}
            player2={match.team_b_player_2}
            photo1={match.team_b_player_1_photo}
            photo2={match.team_b_player_2_photo}
          />
        </div>
      </div>

      <SpectatorGameInfoBadges match={match} />
    </div>
  )
}
