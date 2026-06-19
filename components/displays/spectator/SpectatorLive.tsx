import type { VenueBranding } from '@/lib/venue'
import type { MatchState } from '@/lib/types/match'
import GradientWaveDrift from '@/components/backgrounds/GradientWaveDrift'
import { getPlayerInitials, getSpectatorTeamSurnameRows } from '@/lib/utils/name-format'
import { SpectatorGameInfoBadges } from './SpectatorGameInfoBadges'
import { SpectatorHeader } from './SpectatorHeader'
import {
  countSetsWonByTeam,
  formatLivePointDisplay,
  spectatorSetDotCount,
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
  const setsToWin = match.sets_to_win ?? 1
  const setDotCount = spectatorSetDotCount(setsToWin)
  const setsWonA = countSetsWonByTeam(match.set_scores, 'a')
  const setsWonB = countSetsWonByTeam(match.set_scores, 'b')
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

  function renderTeamNameRows(lines: string[]) {
    if (lines.length === 1) {
      return (
        <div className="spectator-live-name-row">
          <span>{lines[0]}</span>
        </div>
      )
    }
    return (
      <>
        <div className="spectator-live-name-row">
          <span>{lines[0]}</span>
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
        <div className="spectator-live-card-row">
          <div className="spectator-live-serve-slot" aria-hidden>
            {isServing('a') && <span className="spectator-live-serve" />}
          </div>
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

              <div className="spectator-live-names">{renderTeamNameRows(teamALines)}</div>

              <div className="spectator-live-sets" aria-hidden>
                {Array.from({ length: setDotCount }).map((_, i) => (
                  <div
                    key={i}
                    className={`spectator-live-set-dot ${
                      setsWonA > i
                        ? 'spectator-live-set-won-a'
                        : 'spectator-live-set-pending'
                    }`}
                  />
                ))}
              </div>

              <div className="spectator-live-score-strip">
                <div className="spectator-live-games">{match.team_a_games ?? 0}</div>
                <div className="spectator-live-points">
                  {formatLivePointDisplay('a', match)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="spectator-live-card-row">
          <div className="spectator-live-serve-slot" aria-hidden>
            {isServing('b') && <span className="spectator-live-serve" />}
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

              <div className="spectator-live-names">{renderTeamNameRows(teamBLines)}</div>

              <div className="spectator-live-sets" aria-hidden>
                {Array.from({ length: setDotCount }).map((_, i) => (
                  <div
                    key={i}
                    className={`spectator-live-set-dot ${
                      setsWonB > i
                        ? 'spectator-live-set-won-b'
                        : 'spectator-live-set-pending'
                    }`}
                  />
                ))}
              </div>

              <div className="spectator-live-score-strip">
                <div className="spectator-live-games">{match.team_b_games ?? 0}</div>
                <div className="spectator-live-points">
                  {formatLivePointDisplay('b', match)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SpectatorGameInfoBadges match={match} />
    </div>
  )
}
