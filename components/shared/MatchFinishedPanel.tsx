'use client'

import type { ReactNode } from 'react'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import { MatchPreviewAvatar } from '@/components/shared/MatchPreviewAvatar'
import type { VenueBranding } from '@/lib/venue'
import { formatTeamScoreboard, getTeamDisplayNameRows } from '@/lib/utils/name-format'
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

/** Winner avatars, win line, and score — shared by player post-game and court match win. */
export function MatchFinishedWinnerCard({
  match,
  className = '',
}: {
  match: MatchFinishedMatch
  className?: string
}) {
  const winnerTeam = resolveFinishedWinnerSide(match)
  if (winnerTeam === null) return null

  const scoreRows = normalizedSetScoreRows(match.set_scores, match.team_a_games, match.team_b_games)

  return (
    <div className={`preview-card playing-finished-card ${className}`.trim()}>
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
    </div>
  )
}

export function formatFinishedScoreLine(rows: { a: number; b: number }[]): string {
  return rows.map((r) => `${r.a}-${r.b}`).join(' ')
}

function scoreNumClass(
  side: 'a' | 'b',
  row: { a: number; b: number },
  winnerSide: 'a' | 'b' | null | undefined,
  singleSet: boolean
): string {
  const tie = row.a === row.b
  if (tie) return 'playing-finished-score-num--tie'

  const aWins = row.a > row.b
  const bWins = row.b > row.a

  if (singleSet && (winnerSide === 'a' || winnerSide === 'b')) {
    const sideWins = side === 'a' ? winnerSide === 'a' : winnerSide === 'b'
    return sideWins ? 'playing-finished-score-num--win' : 'playing-finished-score-num--lose'
  }

  const sideWins = side === 'a' ? aWins : bWins
  return sideWins ? 'playing-finished-score-num--win' : 'playing-finished-score-num--lose'
}

export function MatchFinishedScoresSection({
  setsToWin: _setsToWin,
  rows,
  winnerSide,
}: {
  setsToWin: number
  rows: { a: number; b: number }[]
  /** Mutes the losing side on single-set results; multi-set rows infer per set. */
  winnerSide?: 'a' | 'b' | null
}) {
  const ariaLabel = rows.map((r) => `${r.a} to ${r.b}`).join(', ')
  const singleSet = rows.length === 1
  const neutral = singleSet && winnerSide !== 'a' && winnerSide !== 'b'

  return (
    <p
      className={`playing-finished-score-line${neutral ? ' playing-finished-score-line--neutral' : ''}`}
      aria-label={`Score ${ariaLabel}`}
    >
      {rows.map((r, i) => (
        <span key={i} className="playing-finished-score-set">
          <span
            className={
              neutral ? 'playing-finished-score-num--neutral' : scoreNumClass('a', r, winnerSide, singleSet)
            }
          >
            {r.a}
          </span>
          <span className="playing-finished-score-hyphen" aria-hidden>
            -
          </span>
          <span
            className={
              neutral ? 'playing-finished-score-num--neutral' : scoreNumClass('b', r, winnerSide, singleSet)
            }
          >
            {r.b}
          </span>
        </span>
      ))}
    </p>
  )
}

export interface MatchFinishedPanelProps {
  match: MatchFinishedMatch
  branding?: VenueBranding | null
  courtName: string
  actions: ReactNode
  error?: string | null
  showHeader?: boolean
}

export default function MatchFinishedPanel({
  match,
  branding,
  courtName,
  actions,
  error,
  showHeader = true,
}: MatchFinishedPanelProps) {
  const isAbandoned = match.status === 'abandoned'
  const winnerTeam = resolveFinishedWinnerSide(match)
  const showWinnerHero = winnerTeam !== null
  const scoreRows = normalizedSetScoreRows(match.set_scores, match.team_a_games, match.team_b_games)
  const headerStatus =
    match.status === 'completed' || showWinnerHero ? 'FINISHED' : 'GAME ENDED'

  const main = (
    <>
      {showHeader ? <SetupScreenHeader branding={branding} /> : null}

      <div className="preview-header">
        <div className="preview-status">
          <span className="preview-status-dot preview-status-dot--finished" aria-hidden />
          <span>{headerStatus}</span>
        </div>
        <div className="preview-court">{courtName}</div>
      </div>

      {error && <div className="control-error-message">{error}</div>}

      {showWinnerHero ? (
        <MatchFinishedWinnerCard match={match} />
      ) : (
      <div className="preview-card playing-finished-card">
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
                  {getTeamDisplayNameRows(match.team_a_player_1, match.team_a_player_2, 1).map(
                    (name, index) => (
                      <span key={`team-a-${index}`}>{name}</span>
                    )
                  )}
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
                  {getTeamDisplayNameRows(match.team_b_player_1, match.team_b_player_2, 2).map(
                    (name, index) => (
                      <span key={`team-b-${index}`}>{name}</span>
                    )
                  )}
                </div>
              </div>
            </div>
            <MatchFinishedScoresSection setsToWin={match.sets_to_win} rows={scoreRows} />
            {isAbandoned && !showWinnerHero && (
              <p className="playing-finished-ended-early">Match was ended early</p>
            )}
      </div>
      )}
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
