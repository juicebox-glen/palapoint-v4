'use client'

import type { ReactNode } from 'react'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import { ScoreSepBar } from '@/components/ui/ScoreSepBar'
import { MatchPreviewAvatar } from '@/components/shared/MatchPreviewAvatar'
import type { VenueBranding } from '@/lib/venue'
import { getSurnameUppercase, getTeamDisplayName } from '@/lib/utils/player-names'
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

function winnerSurnamesUpper(
  p1: string | null | undefined,
  p2: string | null | undefined,
  teamNumber: 1 | 2
): string {
  const parts: string[] = []
  if (p1?.trim()) parts.push(getSurnameUppercase(p1))
  if (p2?.trim()) parts.push(getSurnameUppercase(p2))
  return parts.length > 0 ? parts.join(' / ') : getTeamDisplayName([p1, p2], teamNumber).toUpperCase()
}

export function MatchFinishedScoresSection({
  setsToWin,
  rows,
  winnerSide,
}: {
  setsToWin: number
  rows: { a: number; b: number }[]
  /** Single-set headline: mute losing side + dash (multi-set rows infer per set). */
  winnerSide?: 'a' | 'b' | null
}) {
  const multiRow = setsToWin > 1
  if (!multiRow) {
    const r = rows[0] ?? { a: 0, b: 0 }
    if (winnerSide === 'a' || winnerSide === 'b') {
      const aWins = winnerSide === 'a'
      return (
        <p className="playing-finished-score-large playing-finished-score-large--split" aria-label={`Score ${r.a} to ${r.b}`}>
          <span className={aWins ? 'playing-finished-score-num--win' : 'playing-finished-score-num--lose'}>
            {r.a}
          </span>
          <ScoreSepBar className="playing-finished-score-sep" />
          <span className={aWins ? 'playing-finished-score-num--lose' : 'playing-finished-score-num--win'}>
            {r.b}
          </span>
        </p>
      )
    }
    return (
      <p
        className="playing-finished-score-large playing-finished-score-large--split playing-finished-score-large--neutral"
        aria-label={`Score ${r.a} to ${r.b}`}
      >
        <span className="playing-finished-score-num--neutral">{r.a}</span>
        <ScoreSepBar className="playing-finished-score-sep playing-finished-score-sep--neutral" />
        <span className="playing-finished-score-num--neutral">{r.b}</span>
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
              <ScoreSepBar
                className={tie ? 'playing-finished-set-sep playing-finished-set-sep--tie' : 'playing-finished-set-sep'}
              />
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

  const main = (
    <>
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
                ? `${winnerSurnamesUpper(match.team_a_player_1, match.team_a_player_2, 1)} WIN`
                : `${winnerSurnamesUpper(match.team_b_player_1, match.team_b_player_2, 2)} WIN`}
            </p>
            <MatchFinishedScoresSection
              setsToWin={match.sets_to_win}
              rows={scoreRows}
              winnerSide={winnerTeam}
            />
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
                <div className="preview-team-names preview-team-names--headline">
                  <span>
                    {getTeamDisplayName([match.team_a_player_1, match.team_a_player_2], 1)}
                  </span>
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
                <div className="preview-team-names preview-team-names--headline">
                  <span>
                    {getTeamDisplayName([match.team_b_player_1, match.team_b_player_2], 2)}
                  </span>
                </div>
              </div>
            </div>
            <MatchFinishedScoresSection setsToWin={match.sets_to_win} rows={scoreRows} />
            {isAbandoned && <p className="playing-finished-ended-early">Match was ended early</p>}
          </>
        )}
      </div>
    </>
  )

  return (
    <div className="control-panel">
      <div className="control-container control-container--preview">
        <div className="control-preview control-preview--playing-idle">
          <div className="playing-idle-content">{main}</div>
          <div className="preview-footer playing-idle-footer">
            <div className="preview-actions">{actions}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
