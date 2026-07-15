import { PalaLiveAvatar } from '@/components/palalive/PalaLiveAvatar'
import {
  normalizedSetScoreRows,
  resolveFinishedWinnerSide,
  type MatchFinishedMatch,
} from '@/components/shared/MatchFinishedPanel'
import { formatPlayerName, formatTeamScoreboard } from '@/lib/utils/name-format'

export interface PalaLiveStaffShowcaseEndProps {
  match: MatchFinishedMatch
  courtName: string
  error?: string | null
  actionLoading: string | null
  onEditMatch: () => void
  onRematch: () => void
}

export function PalaLiveStaffShowcaseEnd({
  match,
  courtName,
  error,
  actionLoading,
  onEditMatch,
  onRematch,
}: PalaLiveStaffShowcaseEndProps) {
  const winnerSide = resolveFinishedWinnerSide(match)
  const rows = normalizedSetScoreRows(match.set_scores, match.team_a_games, match.team_b_games)
  const busy = Boolean(actionLoading)

  const winnerPlayers =
    winnerSide === 'b'
      ? [
          { name: formatPlayerName(match.team_b_player_1, 'first'), photo: match.team_b_player_1_photo ?? null },
          { name: formatPlayerName(match.team_b_player_2, 'first'), photo: match.team_b_player_2_photo ?? null },
        ]
      : [
          { name: formatPlayerName(match.team_a_player_1, 'first'), photo: match.team_a_player_1_photo ?? null },
          { name: formatPlayerName(match.team_a_player_2, 'first'), photo: match.team_a_player_2_photo ?? null },
        ]
  const winnerPlayersFiltered = winnerPlayers.filter((p) => p.name)

  const winLine =
    winnerSide === 'b'
      ? `${formatTeamScoreboard(match.team_b_player_1, match.team_b_player_2, 2)} Win`
      : `${formatTeamScoreboard(match.team_a_player_1, match.team_a_player_2, 1)} Win`

  return (
    <div className="palalive-staff-body">
      <div className="palalive-staff-status-row">
        <div className="palalive-staff-live is-finished">
          <span className="palalive-staff-live-dot" />
          Finished
        </div>
        <div className="palalive-staff-court">{courtName}</div>
      </div>

      {error ? <p className="palalive-staff-error">{error}</p> : null}

      <div className="palalive-staff-matchup-card">
        {winnerSide ? (
          <>
            <div className="palalive-staff-win-avatars">
              {winnerPlayersFiltered.map((p) => (
                <PalaLiveAvatar key={p.name} name={p.name} photoUrl={p.photo} />
              ))}
            </div>
            <p className="palalive-staff-win-line">{winLine}</p>
          </>
        ) : null}
        <p className="palalive-staff-score-line">
          {rows.map((row, i) => (
            <span className="palalive-staff-score-set" key={i}>
              <span
                className={
                  rows.length === 1
                    ? winnerSide === 'a'
                      ? 'palalive-staff-score-num--win'
                      : winnerSide === 'b'
                        ? 'palalive-staff-score-num--lose'
                        : 'palalive-staff-score-num--tie'
                    : row.a > row.b
                      ? 'palalive-staff-score-num--win'
                      : row.a < row.b
                        ? 'palalive-staff-score-num--lose'
                        : 'palalive-staff-score-num--tie'
                }
              >
                {row.a}
              </span>
              <span className="palalive-staff-score-hyphen">-</span>
              <span
                className={
                  rows.length === 1
                    ? winnerSide === 'b'
                      ? 'palalive-staff-score-num--win'
                      : winnerSide === 'a'
                        ? 'palalive-staff-score-num--lose'
                        : 'palalive-staff-score-num--tie'
                    : row.b > row.a
                      ? 'palalive-staff-score-num--win'
                      : row.b < row.a
                        ? 'palalive-staff-score-num--lose'
                        : 'palalive-staff-score-num--tie'
                }
              >
                {row.b}
              </span>
            </span>
          ))}
        </p>
      </div>

      <div className="palalive-staff-footer">
        <button type="button" className="palalive-staff-btn palalive-staff-btn--secondary" onClick={onEditMatch} disabled={busy}>
          Edit Match
        </button>
        <button type="button" className="palalive-staff-btn palalive-staff-btn--primary" onClick={onRematch} disabled={busy}>
          {actionLoading === 'rematch' ? '…' : 'Rematch'}
        </button>
      </div>
    </div>
  )
}
