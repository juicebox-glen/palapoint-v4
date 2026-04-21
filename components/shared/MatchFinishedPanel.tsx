'use client'

import type { ReactNode } from 'react'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import { MatchPreviewAvatar } from '@/components/shared/MatchPreviewAvatar'
import type { VenueBranding } from '@/lib/venue'
import { formatNameAbbreviated, getSurnameUppercase } from '@/lib/utils/player-names'
import '@/app/styles/control-panel.css'

/** Row shape from DB / API (games per set). */
export type MatchFinishedSetScoreRow = {
  team_a?: number
  team_b?: number
  team_a_games?: number
  team_b_games?: number
}

export interface MatchFinishedMatch {
  status: string
  winner: string | null
  sets_to_win: number
  team_a_games: number
  team_b_games: number
  set_scores?: MatchFinishedSetScoreRow[] | null
  team_a_player_1?: string | null
  team_a_player_2?: string | null
  team_b_player_1?: string | null
  team_b_player_2?: string | null
  team_a_player_1_photo?: string | null
  team_a_player_2_photo?: string | null
  team_b_player_1_photo?: string | null
  team_b_player_2_photo?: string | null
}

export function normalizedSetScoreRows(
  set_scores: MatchFinishedSetScoreRow[] | null | undefined,
  team_a_games: number,
  team_b_games: number
): { a: number; b: number }[] {
  const raw = set_scores?.length ? set_scores : []
  const rows = raw.map((s) => ({
    a: s.team_a_games ?? s.team_a ?? 0,
    b: s.team_b_games ?? s.team_b ?? 0,
  }))
  if (rows.length > 0) return rows
  return [{ a: team_a_games, b: team_b_games }]
}

function winnerSurnamesUpper(p1: string | null | undefined, p2: string | null | undefined, fallback: string): string {
  const parts: string[] = []
  if (p1?.trim()) parts.push(getSurnameUppercase(p1))
  if (p2?.trim()) parts.push(getSurnameUppercase(p2))
  return parts.length > 0 ? parts.join(' / ') : fallback
}

export function MatchFinishedScoresSection({
  setsToWin,
  rows,
}: {
  setsToWin: number
  rows: { a: number; b: number }[]
}) {
  const multiRow = setsToWin > 1
  if (!multiRow) {
    const r = rows[0] ?? { a: 0, b: 0 }
    return (
      <p className="playing-finished-score-large">
        {r.a} - {r.b}
      </p>
    )
  }
  return (
    <div className="playing-finished-set-rows">
      {rows.map((r, i) => {
        const aWins = r.a > r.b
        const bWins = r.b > r.a
        const tie = r.a === r.b
        const classA = tie
          ? 'playing-finished-set-score--tie'
          : aWins
            ? 'playing-finished-set-score--win'
            : 'playing-finished-set-score--lose'
        const classB = tie
          ? 'playing-finished-set-score--tie'
          : bWins
            ? 'playing-finished-set-score--win'
            : 'playing-finished-set-score--lose'
        return (
          <div key={i} className="playing-finished-set-row">
            <span className="playing-finished-set-label">SET {i + 1}</span>
            <div className="playing-finished-set-scores">
              <span className={classA}>{r.a}</span>
              <span className="playing-finished-set-score--lose"> - </span>
              <span className={classB}>{r.b}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export interface MatchFinishedPanelProps {
  match: MatchFinishedMatch
  branding?: VenueBranding | null
  courtName: string
  actions: ReactNode
  error?: string | null
}

export default function MatchFinishedPanel({
  match,
  branding,
  courtName,
  actions,
  error,
}: MatchFinishedPanelProps) {
  const isAbandoned = match.status === 'abandoned'
  const hasWinner = Boolean(match.winner) && !isAbandoned
  const winnerTeam: 'a' | 'b' | null =
    match.winner === 'a' || match.winner === 'b' ? match.winner : null
  const scoreRows = normalizedSetScoreRows(match.set_scores, match.team_a_games, match.team_b_games)
  const headerStatus = isAbandoned ? 'GAME ENDED' : 'FINISHED'

  return (
    <div className="control-panel">
      <div className="control-container control-container--preview">
        <div className="control-preview">
          <SetupScreenHeader branding={branding} />

          <div className="preview-header">
            <div className="preview-status">
              <span className="preview-status-dot preview-status-dot--finished" aria-hidden />
              <span>{headerStatus}</span>
            </div>
            <div className="preview-court">{courtName}</div>
          </div>

          {error && <div className="control-error-message">{error}</div>}

          <div className="preview-card playing-finished-card">
            {hasWinner && winnerTeam ? (
              <>
                <div className="playing-finished-winner-avatars">
                  <div className="preview-team-avatars">
                    {winnerTeam === 'a' ? (
                      <>
                        <MatchPreviewAvatar
                          photo={match.team_a_player_1_photo}
                          name={match.team_a_player_1}
                          team="a"
                        />
                        <MatchPreviewAvatar
                          photo={match.team_a_player_2_photo}
                          name={match.team_a_player_2}
                          team="a"
                        />
                      </>
                    ) : (
                      <>
                        <MatchPreviewAvatar
                          photo={match.team_b_player_1_photo}
                          name={match.team_b_player_1}
                          team="b"
                        />
                        <MatchPreviewAvatar
                          photo={match.team_b_player_2_photo}
                          name={match.team_b_player_2}
                          team="b"
                        />
                      </>
                    )}
                  </div>
                </div>
                <p className="playing-finished-win-line">
                  {winnerTeam === 'a'
                    ? `${winnerSurnamesUpper(match.team_a_player_1, match.team_a_player_2, 'TEAM A')} WIN`
                    : `${winnerSurnamesUpper(match.team_b_player_1, match.team_b_player_2, 'TEAM B')} WIN`}
                </p>
                <MatchFinishedScoresSection setsToWin={match.sets_to_win} rows={scoreRows} />
              </>
            ) : (
              <>
                <div className="preview-matchup">
                  <div className="preview-team preview-team-a">
                    <div className="preview-team-avatars">
                      <MatchPreviewAvatar
                        photo={match.team_a_player_1_photo}
                        name={match.team_a_player_1}
                        team="a"
                      />
                      <MatchPreviewAvatar
                        photo={match.team_a_player_2_photo}
                        name={match.team_a_player_2}
                        team="a"
                      />
                    </div>
                    <div className="preview-team-names">
                      <span>{formatNameAbbreviated(match.team_a_player_1)}</span>
                      <span>{formatNameAbbreviated(match.team_a_player_2)}</span>
                    </div>
                  </div>
                  <div className="preview-vs-column">
                    <span className="preview-vs">VS</span>
                  </div>
                  <div className="preview-team preview-team-b">
                    <div className="preview-team-avatars">
                      <MatchPreviewAvatar
                        photo={match.team_b_player_1_photo}
                        name={match.team_b_player_1}
                        team="b"
                      />
                      <MatchPreviewAvatar
                        photo={match.team_b_player_2_photo}
                        name={match.team_b_player_2}
                        team="b"
                      />
                    </div>
                    <div className="preview-team-names">
                      <span>{formatNameAbbreviated(match.team_b_player_1)}</span>
                      <span>{formatNameAbbreviated(match.team_b_player_2)}</span>
                    </div>
                  </div>
                </div>
                <MatchFinishedScoresSection setsToWin={match.sets_to_win} rows={scoreRows} />
                {isAbandoned && <p className="playing-finished-ended-early">Match was ended early</p>}
              </>
            )}
          </div>

          <div className="preview-footer">
            <div className="preview-actions">{actions}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
