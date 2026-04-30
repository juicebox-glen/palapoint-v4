import type { VenueBranding } from '@/lib/venue'
import type { MatchState } from '@/lib/types/match'
import GradientWaveDrift from '@/components/backgrounds/GradientWaveDrift'
import { getPlayerInitials, getSpectatorTeamSurnameRows } from '@/lib/utils/player-names'
import { SpectatorHeader } from './SpectatorHeader'
import { pregameModeLabel, pregameSetsLabel } from './utils'

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
          <div className="spectator-pregame-side-inner">
            <div className="spectator-pregame-photos">
              <div className="spectator-pregame-photo-wrap spectator-pregame-photo-a">
                {match.team_a_player_1_photo ? (
                  <img src={match.team_a_player_1_photo} alt="" />
                ) : (
                  <span className="spectator-pregame-initials">
                    {getPlayerInitials(match.team_a_player_1)}
                  </span>
                )}
              </div>
              <div className="spectator-pregame-photo-wrap spectator-pregame-photo-a">
                {match.team_a_player_2_photo ? (
                  <img src={match.team_a_player_2_photo} alt="" />
                ) : (
                  <span className="spectator-pregame-initials">
                    {getPlayerInitials(match.team_a_player_2)}
                  </span>
                )}
              </div>
            </div>
            <div className="spectator-pregame-names spectator-pregame-names-a">
              {getSpectatorTeamSurnameRows(match.team_a_player_1, match.team_a_player_2, 1).map(
                (label, i) => (
                  <span key={i}>{label}</span>
                )
              )}
              <div className="spectator-pregame-names-divider" aria-hidden />
            </div>
          </div>
        </div>

        <div className="spectator-pregame-vs">VS</div>

        <div className="spectator-pregame-side spectator-pregame-side-b">
          <div className="spectator-pregame-side-inner">
            <div className="spectator-pregame-photos">
              <div className="spectator-pregame-photo-wrap spectator-pregame-photo-b">
                {match.team_b_player_1_photo ? (
                  <img src={match.team_b_player_1_photo} alt="" />
                ) : (
                  <span className="spectator-pregame-initials">
                    {getPlayerInitials(match.team_b_player_1)}
                  </span>
                )}
              </div>
              <div className="spectator-pregame-photo-wrap spectator-pregame-photo-b">
                {match.team_b_player_2_photo ? (
                  <img src={match.team_b_player_2_photo} alt="" />
                ) : (
                  <span className="spectator-pregame-initials">
                    {getPlayerInitials(match.team_b_player_2)}
                  </span>
                )}
              </div>
            </div>
            <div className="spectator-pregame-names spectator-pregame-names-b">
              <div className="spectator-pregame-names-divider" aria-hidden />
              {getSpectatorTeamSurnameRows(match.team_b_player_1, match.team_b_player_2, 2).map(
                (label, i) => (
                  <span key={i}>{label}</span>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="spectator-pregame-badges">
        <span className="spectator-pregame-badge">
          {pregameSetsLabel(match.sets_to_win)}
        </span>
        <span className="spectator-pregame-badge">
          {pregameModeLabel(match.game_mode)}
        </span>
      </div>
    </div>
  )
}
