'use client'

import { useMemo } from 'react'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import { MatchPreviewAvatar } from '@/components/shared/MatchPreviewAvatar'
import { ScoreSepBar } from '@/components/ui/ScoreSepBar'
import { brandingStylesFor, type VenueBranding } from '@/lib/venue'
import { abbreviateSurname } from '@/lib/utils/player-names'
import { normalizedSetScoreRows } from '@/components/shared/MatchFinishedPanel'
import '@/app/styles/control-panel.css'

export interface SessionReviewGame {
  id: string
  team_a_player_1: string | null
  team_a_player_2: string | null
  team_b_player_1: string | null
  team_b_player_2: string | null
  team_a_player_1_photo?: string | null
  team_a_player_2_photo?: string | null
  team_b_player_1_photo?: string | null
  team_b_player_2_photo?: string | null
  winner: string | null
  set_scores: Array<{
    team_a?: number
    team_b?: number
    team_a_games?: number
    team_b_games?: number
  }>
  team_a_games?: number
  team_b_games?: number
  created_at: string
  completed_at: string | null
  status?: string
  live_match_id?: string
}

export interface SessionReviewSession {
  id: string
  court_id: string
  started_at: string
  ended_at: string | null
}

export interface SessionReviewDisplayProps {
  courtName: string
  session: SessionReviewSession | null
  games: SessionReviewGame[]
  loading?: boolean
  branding?: VenueBranding | null
  /** When set, game rows navigate here (production: `/game/[id]`). Omit in preview to disable navigation. */
  onGameClick?: (gameId: string) => void
}

/** Temporarily off — re-enable to restore row tap → match stats. */
export const SESSION_REVIEW_GAME_NAV_ENABLED = false

function getTeamLabel(name: string | null | undefined, fallback: string): string {
  if (!name?.trim()) return fallback
  return abbreviateSurname(name)
}

type SessionPlayer = { key: string; name: string; photo: string | null; team: 'a' | 'b' }

function uniqueSessionPlayers(games: SessionReviewGame[]): SessionPlayer[] {
  const order: string[] = []
  const map = new Map<string, SessionPlayer>()

  function add(
    name: string | null | undefined,
    photo: string | null | undefined,
    team: 'a' | 'b'
  ) {
    const trimmed = name?.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase()
    const existing = map.get(key)
    if (!existing) {
      map.set(key, { key, name: trimmed, photo: photo ?? null, team })
      order.push(key)
    } else if (!existing.photo && photo) {
      map.set(key, { ...existing, photo })
    }
  }

  for (const g of games) {
    add(g.team_a_player_1, g.team_a_player_1_photo, 'a')
    add(g.team_a_player_2, g.team_a_player_2_photo, 'a')
    add(g.team_b_player_1, g.team_b_player_1_photo, 'b')
    add(g.team_b_player_2, g.team_b_player_2_photo, 'b')
  }

  return order.map((k) => map.get(k)!)
}

function sessionGameSetRows(game: SessionReviewGame): { a: number; b: number }[] {
  return normalizedSetScoreRows(
    game.set_scores,
    game.team_a_games ?? 0,
    game.team_b_games ?? 0
  )
}

function countSetsWon(rows: { a: number; b: number }[]): { setsA: number; setsB: number } {
  let setsA = 0
  let setsB = 0
  for (const r of rows) {
    if (r.a > r.b) setsA++
    else if (r.b > r.a) setsB++
  }
  return { setsA, setsB }
}

/** Prefer DB `winner`; else infer from scores (games or set wins). */
function resolvedWinnerSide(
  winner: string | null,
  scoreA: number,
  scoreB: number
): 'a' | 'b' | null {
  if (winner === 'a' || winner === 'b') return winner
  if (scoreA > scoreB) return 'a'
  if (scoreB > scoreA) return 'b'
  return null
}

function singleSetScoreClasses(
  r: { a: number; b: number },
  winnerSide: 'a' | 'b' | null
): { classA: string; classB: string; sepClass: string } {
  const tie = r.a === r.b
  if (tie) {
    return {
      classA: 'playing-finished-set-score--tie',
      classB: 'playing-finished-set-score--tie',
      sepClass: 'playing-finished-set-sep playing-finished-set-sep--tie',
    }
  }
  const aWinsMatch =
    winnerSide === 'a' ? true : winnerSide === 'b' ? false : r.a > r.b
  return {
    classA: aWinsMatch ? 'playing-finished-set-score--win' : 'playing-finished-set-score--lose',
    classB: aWinsMatch ? 'playing-finished-set-score--lose' : 'playing-finished-set-score--win',
    sepClass: 'playing-finished-set-sep',
  }
}

export default function SessionReviewDisplay({
  courtName,
  session,
  games,
  loading = false,
  branding = null,
  onGameClick,
}: SessionReviewDisplayProps) {
  const gameClickHandler = SESSION_REVIEW_GAME_NAV_ENABLED ? onGameClick : undefined
  const sessionPlayers = useMemo(() => uniqueSessionPlayers(games), [games])

  const totalMinutes =
    session?.started_at && session?.ended_at
      ? Math.round(
          (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) /
            1000 /
            60
        )
      : 0

  if (loading) {
    return (
      <div className="control-panel" style={brandingStylesFor(branding)}>
        <div className="control-container control-container--preview">
          <div className="control-preview control-preview--session-review">
            <SetupScreenHeader branding={branding} />
            <div className="control-loading">Loading…</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="control-panel" style={brandingStylesFor(branding)}>
      <div className="control-container control-container--preview">
        <div className="control-preview control-preview--session-review">
          <SetupScreenHeader branding={branding} />

          <div className="preview-header">
            <div className="preview-status">
              <span className="preview-status-dot preview-status-dot--finished" aria-hidden />
              <span>SESSION END</span>
            </div>
            <div className="preview-court">{courtName}</div>
          </div>

          <div className="preview-card session-review-games-card">
            {sessionPlayers.length > 0 ? (
              <div className="session-review-players">
                <div className="preview-team-avatars">
                  {sessionPlayers.map((p) => (
                    <MatchPreviewAvatar
                      key={p.key}
                      photo={p.photo}
                      name={p.name}
                      team={p.team}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="session-review-game-rows">
              {games.length === 0 ? (
                <p className="session-review-empty">No games played</p>
              ) : (
                games.map((game) => {
                  const setRows = sessionGameSetRows(game)
                  const r0 = setRows[0] ?? { a: 0, b: 0 }
                  const { setsA, setsB } =
                    (game.set_scores?.length ?? 0) > 1
                      ? countSetsWon(setRows)
                      : { setsA: r0.a, setsB: r0.b }
                  const displayScore = { a: setsA, b: setsB }
                  const winnerSide = resolvedWinnerSide(game.winner, setsA, setsB)
                  const { classA: scoreAClass, classB: scoreBClass, sepClass: scoreSepClass } =
                    singleSetScoreClasses(displayScore, winnerSide)

                  return (
                    <div
                      key={game.id}
                      className={`session-review-game-row${
                        gameClickHandler
                          ? ' session-review-game-row--clickable session-review-game-row--has-chevron'
                          : ' session-review-game-row--centered-score'
                      }`}
                      role={gameClickHandler ? 'button' : undefined}
                      tabIndex={gameClickHandler ? 0 : undefined}
                      onClick={gameClickHandler ? () => gameClickHandler(game.id) : undefined}
                      onKeyDown={
                        gameClickHandler
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                gameClickHandler(game.id)
                              }
                            }
                          : undefined
                      }
                    >
                      <div
                        className={`session-review-game-names session-review-game-names--a ${
                          winnerSide === 'a'
                            ? 'session-review-game-names--winning'
                            : 'session-review-game-names--losing'
                        }`}
                      >
                        <span className="session-review-name">
                          {getTeamLabel(game.team_a_player_1, 'Team A')}
                        </span>
                        <span className="session-review-name">
                          {getTeamLabel(game.team_a_player_2, '')}
                        </span>
                      </div>

                      <div className="session-review-game-score playing-finished-set-scores">
                        <span className={scoreAClass}>{displayScore.a}</span>
                        <ScoreSepBar className={scoreSepClass} />
                        <span className={scoreBClass}>{displayScore.b}</span>
                      </div>

                      <div
                        className={`session-review-game-names session-review-game-names--end ${
                          winnerSide === 'b'
                            ? 'session-review-game-names--winning'
                            : 'session-review-game-names--losing'
                        }`}
                      >
                        <span className="session-review-name">
                          {getTeamLabel(game.team_b_player_1, 'Team B')}
                        </span>
                        <span className="session-review-name">
                          {getTeamLabel(game.team_b_player_2, '')}
                        </span>
                      </div>

                      {gameClickHandler ? (
                        <div className="session-review-chevron" aria-hidden>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                              d="M7 5l5 5-5 5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="session-review-stats">
            <div className="session-review-stat">
              <div className="session-review-stat-num">{games.length}</div>
              <div className="session-review-stat-label">Games played</div>
            </div>
            <div className="session-review-stat">
              <div className="session-review-stat-num">{totalMinutes}</div>
              <div className="session-review-stat-label">Total time (m)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
