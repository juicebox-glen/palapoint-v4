'use client'

import { formatPlayerName, getPlayerInitials } from '@/lib/utils/name-format'

export interface BoardStandingsPlayer {
  id: string
  name: string
  photo_url?: string | null
  total_points: number
  game_difference: number
  matches_played?: number
  matches_won?: number
  matches_drawn?: number
  matches_lost?: number
}

export type BoardStandingsMode = 'live' | 'setup' | 'completed'

export interface BoardStandingsProps {
  standings: BoardStandingsPlayer[]
  mode: BoardStandingsMode
  title?: string
  /** Live / setup: players resting this round (shown below ranked rows). */
  restingPlayers?: BoardStandingsPlayer[]
  flashPlayerIds?: Set<string>
  /** Override default empty copy */
  emptyMessage?: string
  /** `hero` = completed screen (slightly larger type) */
  size?: 'panel' | 'hero'
}

type GroupedStanding = { rank: number; players: BoardStandingsPlayer[] }

function sortStandings(players: BoardStandingsPlayer[]): BoardStandingsPlayer[] {
  return [...players].sort((a, b) => {
    const tpB = b.total_points ?? 0
    const tpA = a.total_points ?? 0
    if (tpB !== tpA) return tpB - tpA
    return (b.game_difference ?? 0) - (a.game_difference ?? 0)
  })
}

function groupStandings(players: BoardStandingsPlayer[]): GroupedStanding[] {
  const sorted = sortStandings(players)
  const groups: GroupedStanding[] = []
  let rank = 1
  let i = 0
  while (i < sorted.length) {
    const p = sorted[i]
    const groupPlayers = [p]
    while (i + 1 < sorted.length) {
      const next = sorted[i + 1]
      if (
        (next.total_points ?? 0) === (p.total_points ?? 0) &&
        (next.game_difference ?? 0) === (p.game_difference ?? 0)
      ) {
        groupPlayers.push(next)
        i++
      } else break
    }
    groups.push({ rank, players: groupPlayers })
    rank += groupPlayers.length
    i++
  }
  return groups
}

function flattenStandingsRows(players: BoardStandingsPlayer[]) {
  const groups = groupStandings(players)
  const rows: { player: BoardStandingsPlayer; rank: number; tiedGroup: boolean }[] = []
  for (const g of groups) {
    const tiedGroup = g.players.length > 1
    for (const p of g.players) {
      rows.push({ player: p, rank: g.rank, tiedGroup })
    }
  }
  return rows
}

function formatGd(gd: number): string {
  if (gd > 0) return `+${gd}`
  return String(gd)
}

function defaultEmptyCopy(mode: BoardStandingsMode): string {
  if (mode === 'completed') return 'No standings available'
  return 'Standings will appear after Round 1'
}

export function BoardStandings({
  standings,
  mode,
  title = 'Standings',
  restingPlayers = [],
  flashPlayerIds,
  emptyMessage,
  size = 'panel',
}: BoardStandingsProps) {
  const isLiveLike = mode === 'live' || mode === 'setup'
  const flash = flashPlayerIds ?? new Set<string>()
  const hasRanked = standings.length > 0
  const hasResting = isLiveLike && restingPlayers.length > 0

  if (!hasRanked && !hasResting) {
    const copy = emptyMessage ?? defaultEmptyCopy(mode)
    return (
      <div className={`board-standings-root board-standings-root--empty board-standings-root--${size}`}>
        <h2 className="board-standings-title">{title}</h2>
        <p className="board-standings-empty-message">{copy}</p>
      </div>
    )
  }

  const rankedRows = hasRanked ? flattenStandingsRows(standings) : []

  const rootClass = [
    'board-standings-root',
    `board-standings-root--${size}`,
    isLiveLike ? 'board-standings-root--live' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      <h2 className="board-standings-title">{title}</h2>

      <div className="board-standings-list">
        {rankedRows.map(({ player, rank, tiedGroup }) => {
          const isTopThree = rank <= 3
          const gd = player.game_difference ?? 0
          const rowClass = [
            'board-standings-row',
            isTopThree ? `board-standings-row--rank-${rank}` : '',
            tiedGroup ? 'board-standings-row--tied' : '',
            flash.has(player.id) ? 'board-standings-row--updated' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <div key={player.id} className={rowClass}>
              <div className="board-standings-rank">
                {rank === 1 && <span className="board-standings-medal">🏆</span>}
                {rank === 2 && <span className="board-standings-medal">🥈</span>}
                {rank === 3 && <span className="board-standings-medal">🥉</span>}
                {rank > 3 && <span className="board-standings-rank-num">{rank}</span>}
              </div>

              <div className="board-standings-card">
                <div className="board-standings-info">
                  <span className="board-standings-name">{formatPlayerName(player.name, 'full')}</span>
                  <span className="board-standings-points">
                    {player.total_points ?? 0} pts
                    <span
                      className={`board-standings-diff ${gd >= 0 ? 'board-standings-diff--positive' : 'board-standings-diff--negative'}`}
                    >
                      {formatGd(gd)}
                    </span>
                  </span>
                  {size === 'hero' && mode === 'completed' && (
                    <span className="board-standings-record">
                      {player.matches_played ?? 0} played · W{player.matches_won ?? 0}-D{player.matches_drawn ?? 0}-L
                      {player.matches_lost ?? 0}
                    </span>
                  )}
                </div>

                <div className="board-standings-avatar">
                  {player.photo_url ? (
                    <img src={player.photo_url} alt="" />
                  ) : (
                    <span className="board-standings-initials">{getPlayerInitials(player.name)}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {hasResting &&
          restingPlayers.map((player) => (
            <div
              key={`rest-${player.id}`}
              className="board-standings-row board-standings-row--resting"
              aria-label={`${formatPlayerName(player.name, 'full')}, resting this round`}
            >
              <div className="board-standings-rank">
                <span className="board-standings-rank-resting-dot">·</span>
              </div>
              <div className="board-standings-card">
                <div className="board-standings-info">
                  <span className="board-standings-name">{formatPlayerName(player.name, 'full')}</span>
                  <span className="board-standings-points board-standings-points--muted">
                    Resting · {player.total_points ?? 0} pts
                    <span className="board-standings-diff board-standings-diff--muted">{formatGd(player.game_difference ?? 0)}</span>
                  </span>
                </div>
                <div className="board-standings-avatar">
                  {player.photo_url ? (
                    <img src={player.photo_url} alt="" />
                  ) : (
                    <span className="board-standings-initials">{getPlayerInitials(player.name)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
