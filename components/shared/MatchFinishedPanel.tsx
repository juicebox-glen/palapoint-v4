'use client'

import type { ReactNode } from 'react'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import { ScoreSepBar } from '@/components/ui/ScoreSepBar'
import { MatchPreviewAvatar } from '@/components/shared/MatchPreviewAvatar'
import type { VenueBranding } from '@/lib/venue'
import { formatTeamDisplay, formatTeamScoreboard } from '@/lib/utils/name-format'
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

function coerceWinnerSide(w: string | null | undefined): 'a' | 'b' | null {
  if (w === 'a' || w === 'b') return w
  if (typeof w === 'string') {
    const x = w.trim().toLowerCase()
    if (x === 'a' || x === 'team_a') return 'a'
    if (x === 'b' || x === 'team_b') return 'b'
  }
  return null
}

/**
 * Prefer DB `winner`; otherwise infer from set rows / games so abandoned matches
 * with a clear leader still use the single-team FINISHED layout (design-system parity).
 */
export function resolveFinishedWinnerSide(match: MatchFinishedMatch): 'a' | 'b' | null {
  const explicit = coerceWinnerSide(match.winner)
  if (explicit) return explicit

  const rows = normalizedSetScoreRows(match.set_scores, match.team_a_games, match.team_b_games)
  if (rows.length === 0) return null

  let setsWonA = 0
  let setsWonB = 0
  for (const r of rows) {
    if (r.a > r.b) setsWonA++
    else if (r.b > r.a) setsWonB++
  }

  const need = Math.max(1, match.sets_to_win ?? 1)
  if (setsWonA >= need && setsWonA > setsWonB) return 'a'
  if (setsWonB >= need && setsWonB > setsWonA) return 'b'

  if (setsWonA > setsWonB) return 'a'
  if (setsWonB > setsWonA) return 'b'

  const last = rows[rows.length - 1]
  if (last.a > last.b) return 'a'
  if (last.b > last.a) return 'b'

  return null
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

function winnerTeamScoreboardLabel(
  p1: string | null | undefined,
  p2: string | null | undefined,
  teamNumber: 1 | 2
): string {
  return formatTeamScoreboard(p1, p2, teamNumber)
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
  const winnerTeam = resolveFinishedWinnerSide(match)
  const showWinnerHero = winnerTeam !== null
  const scoreRows = normalizedSetScoreRows(match.set_scores, match.team_a_games, match.team_b_games)
  const headerStatus =
    match.status === 'completed' || showWinnerHero ? 'FINISHED' : 'GAME ENDED'

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
        {showWinnerHero ? (
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
                ? `${winnerTeamScoreboardLabel(match.team_a_player_1, match.team_a_player_2, 1)} WIN`
                : `${winnerTeamScoreboardLabel(match.team_b_player_1, match.team_b_player_2, 2)} WIN`}
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
                    {formatTeamDisplay(match.team_a_player_1, match.team_a_player_2, 1)}
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
                    {formatTeamDisplay(match.team_b_player_1, match.team_b_player_2, 2)}
                  </span>
                </div>
              </div>
            </div>
            <MatchFinishedScoresSection setsToWin={match.sets_to_win} rows={scoreRows} />
            {isAbandoned && !showWinnerHero && (
              <p className="playing-finished-ended-early">Match was ended early</p>
            )}
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
