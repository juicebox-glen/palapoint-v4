import type { VenueBranding } from '@/lib/venue'
import type { MatchState } from '@/lib/types/match'
import GradientWaveDrift from '@/components/backgrounds/GradientWaveDrift'
import { getPlayerInitials, getSpectatorTeamSurnameRows } from '@/lib/utils/player-names'
import { SpectatorHeader } from './SpectatorHeader'
import {
  formatLivePointDisplay,
  getSetIndicators,
  pregameModeLabel,
  pregameSetsLabel,
} from './utils'

interface SpectatorLiveProps {
  match: MatchState
  branding: VenueBranding | null
  brandingStyles: React.CSSProperties
}

export function SpectatorLive({
  match,
  branding,
  brandingStyles,
}: SpectatorLiveProps) {
  const setIndicators = getSetIndicators(match.set_scores, match.sets_to_win ?? 1)
  const courtLabel = (branding?.courtName ?? 'Court 1').toUpperCase()
  const isServing = (team: 'a' | 'b') => match.serving_team === team

  const teamALines = getSpectatorTeamSurnameRows(
    match.team_a_player_1,
    match.team_a_player_2,
    1
  )
  const teamBLines = getSpectatorTeamSurnameRows(
    match.team_b_player_1,
    match.team_b_player_2,
    2
  )

  function renderTeamNameRows(lines: string[], servingTeam: 'a' | 'b') {
    if (lines.length === 1) {
      return (
        <div className="spectator-live-name-row">
          <span>{lines[0]}</span>
          {isServing(servingTeam) && <span className="spectator-live-serve" aria-hidden />}
        </div>
      )
    }
    return (
      <>
        <div className="spectator-live-name-row">
          <span>{lines[0]}</span>
          {isServing(servingTeam) && <span className="spectator-live-serve" aria-hidden />}
        </div>
        <div className="spectator-live-name-row">
          <span>{lines[1]}</span>
        </div>
      </>
    )
  }

  return (
    <div
      className="spectator-container spectator-container--live"
      style={brandingStyles}
    >
      <GradientWaveDrift />
      <SpectatorHeader
        branding={branding}
        variant="live"
        courtLabel={courtLabel}
      />

      <div className="spectator-live-cards">
        <div className="spectator-live-card">
          <div className="spectator-live-card-inner">
            <div className="spectator-live-photos">
              <div className="spectator-live-photo spectator-live-photo-a">
                {match.team_a_player_1_photo ? (
                  <img src={match.team_a_player_1_photo} alt="" />
                ) : (
                  <span className="spectator-live-initials">
                    {getPlayerInitials(match.team_a_player_1)}
                  </span>
                )}
              </div>
              <div className="spectator-live-photo spectator-live-photo-a">
                {match.team_a_player_2_photo ? (
                  <img src={match.team_a_player_2_photo} alt="" />
                ) : (
                  <span className="spectator-live-initials">
                    {getPlayerInitials(match.team_a_player_2)}
                  </span>
                )}
              </div>
            </div>

            <div className="spectator-live-names">{renderTeamNameRows(teamALines, 'a')}</div>

            <div className="spectator-live-sets" aria-hidden>
              {setIndicators.teamA.map((status, i) => (
                <div
                  key={i}
                  className={`spectator-live-set-dot ${
                    status === 'won'
                      ? 'spectator-live-set-won-a'
                      : status === 'lost'
                        ? 'spectator-live-set-lost'
                        : 'spectator-live-set-pending'
                  }`}
                />
              ))}
            </div>

            <div className="spectator-live-games">{match.team_a_games ?? 0}</div>

            <div className="spectator-live-points">
              {formatLivePointDisplay('a', match)}
            </div>
          </div>
        </div>

        <div className="spectator-live-card">
          <div className="spectator-live-card-inner">
            <div className="spectator-live-photos">
              <div className="spectator-live-photo spectator-live-photo-b">
                {match.team_b_player_1_photo ? (
                  <img src={match.team_b_player_1_photo} alt="" />
                ) : (
                  <span className="spectator-live-initials">
                    {getPlayerInitials(match.team_b_player_1)}
                  </span>
                )}
              </div>
              <div className="spectator-live-photo spectator-live-photo-b">
                {match.team_b_player_2_photo ? (
                  <img src={match.team_b_player_2_photo} alt="" />
                ) : (
                  <span className="spectator-live-initials">
                    {getPlayerInitials(match.team_b_player_2)}
                  </span>
                )}
              </div>
            </div>

            <div className="spectator-live-names">{renderTeamNameRows(teamBLines, 'b')}</div>

            <div className="spectator-live-sets" aria-hidden>
              {setIndicators.teamB.map((status, i) => (
                <div
                  key={i}
                  className={`spectator-live-set-dot ${
                    status === 'won'
                      ? 'spectator-live-set-won-b'
                      : status === 'lost'
                        ? 'spectator-live-set-lost'
                        : 'spectator-live-set-pending'
                  }`}
                />
              ))}
            </div>

            <div className="spectator-live-games">{match.team_b_games ?? 0}</div>

            <div className="spectator-live-points">
              {formatLivePointDisplay('b', match)}
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
