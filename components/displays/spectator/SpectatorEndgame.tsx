import type { VenueBranding } from '@/lib/venue'
import type { MatchState } from '@/lib/types/match'
import { formatPlayerName, getPlayerInitials } from '@/lib/utils/name-format'
import { ScoreSepBar } from '@/components/ui/ScoreSepBar'
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
                  {getPlayerInitials(match.team_a_player_1)}
                </div>
              )}
              <span className="spectator-endgame-name">
                {formatPlayerName(match.team_a_player_1, 'full') || 'Player 1'}
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
                  {getPlayerInitials(match.team_a_player_2)}
                </div>
              )}
              <span className="spectator-endgame-name">
                {formatPlayerName(match.team_a_player_2, 'full') || 'Player 2'}
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
                <ScoreSepBar className="spectator-endgame-set-sep" />
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
                  {getPlayerInitials(match.team_b_player_1)}
                </div>
              )}
              <span className="spectator-endgame-name">
                {formatPlayerName(match.team_b_player_1, 'full') || 'Player 1'}
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
                  {getPlayerInitials(match.team_b_player_2)}
                </div>
              )}
              <span className="spectator-endgame-name">
                {formatPlayerName(match.team_b_player_2, 'full') || 'Player 2'}
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
