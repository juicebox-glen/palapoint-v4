import { formatPointDisplay } from '@/lib/utils/score-format'
import { getPointSituation } from '@/lib/utils/point-situation'
import { formatTeamScoreboard } from '@/lib/utils/name-format'
import type { MatchState } from '@/lib/types/match'

export interface PalaLiveStaffShowcaseLiveProps {
  match: MatchState
  courtName: string
  /** "Glen & Rob" style — used on the score buttons, matching the mockup's button labels. */
  teamAName: string
  teamBName: string
  error?: string | null
  actionLoading: string | null
  onScoreA: () => void
  onScoreB: () => void
  onUndo: () => void
  onRequestEndMatch: () => void
  showEndConfirm: boolean
  onCancelEndMatch: () => void
  onConfirmEndMatch: () => void
}

export function PalaLiveStaffShowcaseLive({
  match,
  courtName,
  teamAName,
  teamBName,
  error,
  actionLoading,
  onScoreA,
  onScoreB,
  onUndo,
  onRequestEndMatch,
  showEndConfirm,
  onCancelEndMatch,
  onConfirmEndMatch,
}: PalaLiveStaffShowcaseLiveProps) {
  const scoreboardNameA = formatTeamScoreboard(match.team_a_player_1, match.team_a_player_2, 1)
  const scoreboardNameB = formatTeamScoreboard(match.team_b_player_1, match.team_b_player_2, 2)
  const pointsA = formatPointDisplay(
    match.team_a_points,
    match.team_b_points,
    match.is_tiebreak,
    match.is_tiebreak ? match.tiebreak_scores?.team_a : undefined
  )
  const pointsB = formatPointDisplay(
    match.team_b_points,
    match.team_a_points,
    match.is_tiebreak,
    match.is_tiebreak ? match.tiebreak_scores?.team_b : undefined
  )
  const setsToWin = match.sets_to_win ?? 1
  const setsWonA = (match.set_scores ?? []).filter((s) => s.team_a > s.team_b).length
  const setsWonB = (match.set_scores ?? []).filter((s) => s.team_b > s.team_a).length
  const pointSituation = getPointSituation(match)
  const busy = Boolean(actionLoading)

  return (
    <>
      <div className="palalive-staff-body">
        <div className="palalive-staff-status-row">
          <div className="palalive-staff-live">
            <span className="palalive-staff-live-dot" />
            Live
          </div>
          <div className="palalive-staff-court">{courtName}</div>
        </div>

        {error ? <p className="palalive-staff-error">{error}</p> : null}

        <div className="palalive-staff-scoreboard">
          <div className="palalive-staff-scoreboard-cols">
            <div className={`palalive-staff-scoreboard-col ${match.serving_team === 'a' ? 'is-serving' : ''}`}>
              <span className="palalive-staff-scoreboard-team-name">{scoreboardNameA}</span>
              <span className="palalive-staff-scoreboard-point">{pointsA}</span>
              <div className="palalive-staff-scoreboard-set-dots">
                {Array.from({ length: setsToWin }).map((_, i) => (
                  <span key={i} className={`palalive-staff-scoreboard-set-dot ${i < setsWonA ? 'is-won' : ''}`} aria-hidden />
                ))}
              </div>
            </div>
            <div className={`palalive-staff-scoreboard-col is-alt ${match.serving_team === 'b' ? 'is-serving' : ''}`}>
              <span className="palalive-staff-scoreboard-team-name">{scoreboardNameB}</span>
              <span className="palalive-staff-scoreboard-point">{pointsB}</span>
              <div className="palalive-staff-scoreboard-set-dots">
                {Array.from({ length: setsToWin }).map((_, i) => (
                  <span key={i} className={`palalive-staff-scoreboard-set-dot ${i < setsWonB ? 'is-won' : ''}`} aria-hidden />
                ))}
              </div>
            </div>
          </div>
          {match.is_tiebreak ? <span className="palalive-staff-scoreboard-tiebreak">Tiebreak</span> : null}
          <div className="palalive-staff-scoreboard-games">
            <span>{match.team_a_games}</span>
            <span className="palalive-staff-scoreboard-games-dash">–</span>
            <span>{match.team_b_games}</span>
          </div>
        </div>

        {pointSituation ? <span className="palalive-staff-point-badge">{pointSituation.type}</span> : null}
      </div>

      <div className="palalive-staff-thumb-zone">
        <div className="palalive-staff-score-buttons">
          <button type="button" className="palalive-staff-score-btn team-a" onClick={onScoreA} disabled={busy}>
            {actionLoading === 'score-a' ? '…' : `+ ${teamAName}`}
          </button>
          <button type="button" className="palalive-staff-score-btn team-b" onClick={onScoreB} disabled={busy}>
            {actionLoading === 'score-b' ? '…' : `+ ${teamBName}`}
          </button>
        </div>

        <div className="palalive-staff-actions">
          <button type="button" className="palalive-staff-action-btn" onClick={onUndo} disabled={busy}>
            {actionLoading === 'undo' ? 'Undoing…' : 'Undo'}
          </button>
          <button type="button" className="palalive-staff-action-btn is-danger" onClick={onRequestEndMatch} disabled={busy}>
            End Match
          </button>
        </div>
      </div>

      {showEndConfirm ? (
        <div className="palalive-staff-overlay" onClick={() => !busy && onCancelEndMatch()}>
          <div className="palalive-staff-confirm-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="palalive-staff-confirm-title">End Match?</h3>
            <p className="palalive-staff-confirm-text">Are you sure you want to end this match?</p>
            <button
              type="button"
              className="palalive-staff-confirm-btn is-danger"
              onClick={onConfirmEndMatch}
              disabled={actionLoading === 'end'}
            >
              {actionLoading === 'end' ? 'Ending…' : 'End Match'}
            </button>
            <button type="button" className="palalive-staff-confirm-btn is-secondary" onClick={onCancelEndMatch} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
