import type { VenueBranding } from '@/lib/venue'
import type { MatchState } from '@/lib/types/match'
import { SpectatorHeader } from './SpectatorHeader'
import { getEndgameSetScores, getGameModeText } from './utils'

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
  const endgameSets = getEndgameSetScores(match)

  return (
    <div
      className="spectator-container spectator-container--endgame spectator-container--split-field"
      style={brandingStyles}
    >
      <SpectatorHeader
        branding={branding}
        variant="endgame"
        gameModeText={getGameModeText(match.game_mode)}
      />

      <div className="spectator-endgame">
        <div
          className={`spectator-endgame-team ${match.winner === 'a' ? 'spectator-endgame-winner' : ''}`}
        >
          <div className="spectator-endgame-players">
            <div className="spectator-endgame-player">
              {match.team_a_player_1_photo ? (
                <img
                  src={match.team_a_player_1_photo}
                  alt=""
                  className="spectator-endgame-photo"
                />
              ) : (
                <div className="spectator-endgame-avatar" aria-hidden>
                  {match.team_a_player_1?.trim()?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <span className="spectator-endgame-name">
                {match.team_a_player_1?.trim() || 'Player 1'}
              </span>
            </div>
            <div className="spectator-endgame-player">
              {match.team_a_player_2_photo ? (
                <img
                  src={match.team_a_player_2_photo}
                  alt=""
                  className="spectator-endgame-photo"
                />
              ) : (
                <div className="spectator-endgame-avatar" aria-hidden>
                  {match.team_a_player_2?.trim()?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <span className="spectator-endgame-name">
                {match.team_a_player_2?.trim() || 'Player 2'}
              </span>
            </div>
          </div>
          {match.winner === 'a' && (
            <div className="spectator-endgame-winner-label">WINNER</div>
          )}
        </div>

        <div className="spectator-endgame-score">
          {endgameSets.map((set, i) => {
            const a =
              set.team_a ??
              (set as { team_a_games?: number }).team_a_games ??
              0
            const b =
              set.team_b ??
              (set as { team_b_games?: number }).team_b_games ??
              0
            return (
              <div key={i} className="spectator-endgame-set">
                <span
                  className={
                    match.winner === 'a' ? 'spectator-endgame-set-winner' : ''
                  }
                >
                  {a}
                </span>
                <span className="spectator-endgame-set-divider">-</span>
                <span
                  className={
                    match.winner === 'b' ? 'spectator-endgame-set-winner' : ''
                  }
                >
                  {b}
                </span>
              </div>
            )
          })}
        </div>

        <div
          className={`spectator-endgame-team ${match.winner === 'b' ? 'spectator-endgame-winner' : ''}`}
        >
          <div className="spectator-endgame-players">
            <div className="spectator-endgame-player">
              {match.team_b_player_1_photo ? (
                <img
                  src={match.team_b_player_1_photo}
                  alt=""
                  className="spectator-endgame-photo"
                />
              ) : (
                <div className="spectator-endgame-avatar" aria-hidden>
                  {match.team_b_player_1?.trim()?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <span className="spectator-endgame-name">
                {match.team_b_player_1?.trim() || 'Player 1'}
              </span>
            </div>
            <div className="spectator-endgame-player">
              {match.team_b_player_2_photo ? (
                <img
                  src={match.team_b_player_2_photo}
                  alt=""
                  className="spectator-endgame-photo"
                />
              ) : (
                <div className="spectator-endgame-avatar" aria-hidden>
                  {match.team_b_player_2?.trim()?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <span className="spectator-endgame-name">
                {match.team_b_player_2?.trim() || 'Player 2'}
              </span>
            </div>
          </div>
          {match.winner === 'b' && (
            <div className="spectator-endgame-winner-label">WINNER</div>
          )}
        </div>
      </div>
    </div>
  )
}
