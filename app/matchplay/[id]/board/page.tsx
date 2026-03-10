'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import '@/app/styles/matchplay-board.css'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface MatchplayEvent {
  id: string
  name: string
  status: string
  created_at?: string
  player_count?: number
  match_format?: string
  match_duration_minutes?: number | null
  match_target_score?: number | null
  game_mode?: string
  win_points?: number
  draw_points?: number
  loss_points?: number
}

interface MatchplayPlayer {
  id: string
  event_id: string
  name: string
  total_points: number
  matches_played: number
  matches_won: number
  matches_drawn: number
  matches_lost: number
  games_won: number
  games_lost: number
  game_difference: number
  rank?: number
}

interface MatchplayRound {
  id: string
  event_id: string
  round_number: number
  status: string
  match_count?: number
  completed_count?: number
  matches?: MatchplayMatch[]
}

interface MatchplayMatch {
  id: string
  court_label: string
  team_a_player_1_name?: string
  team_a_player_2_name?: string
  team_b_player_1_name?: string
  team_b_player_2_name?: string
  status: string
  team_a_score: number | null
  team_b_score: number | null
  updated_at?: string
}

interface ActivityFeedItem {
  id: string
  teamA: string
  teamB: string
  scoreA: number
  scoreB: number
  court: string
  completedAt: number
}

async function fetchEdgeFunction(path: string, body: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase URL or anon key not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    })
    return res.json()
  } catch (err) {
    console.error('Edge function fetch failed:', err)
    throw err
  }
}

async function callMatchplayEvent(body: Record<string, unknown>) {
  return fetchEdgeFunction('matchplay-event', body)
}

async function callMatchplayPlayer(body: Record<string, unknown>) {
  return fetchEdgeFunction('matchplay-player', body)
}

async function callMatchplayRound(body: Record<string, unknown>) {
  return fetchEdgeFunction('matchplay-round', body)
}

function formatEventDate(createdAt: string | undefined): string {
  if (!createdAt) return ''
  const d = new Date(createdAt)
  return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getFullYear()}`
}

function getGameModeText(mode: string | undefined): string {
  switch (mode) {
    case 'golden_point':
      return 'Golden Point'
    case 'silver_point':
      return 'Silver Point'
    case 'traditional':
      return 'Traditional'
    default:
      return mode ? mode.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : ''
  }
}

function getMatchFormatText(event: MatchplayEvent): string {
  const format = event.match_format
  if (format === 'timed') {
    const mins = event.match_duration_minutes ?? 10
    return `Timed (${mins} min)`
  }
  if (format === 'first_to_points') {
    const target = event.match_target_score ?? 9
    return `First to ${target}`
  }
  return format ? format.replace(/_/g, ' ') : ''
}

function getScoringText(event: MatchplayEvent): string {
  const w = event.win_points ?? 3
  const d = event.draw_points ?? 1
  const l = event.loss_points ?? 0
  return `Win ${w} / Draw ${d} / Loss ${l}`
}

function timeAgo(ms: number): string {
  const sec = Math.floor((Date.now() - ms) / 1000)
  if (sec < 60) return 'just now'
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`
  return `${Math.floor(sec / 86400)} days ago`
}

function formatFeedItem(item: ActivityFeedItem): string {
  const score = `${item.scoreA}-${item.scoreB}`
  const isDraw = item.scoreA === item.scoreB
  if (isDraw) {
    return `${item.teamA} drew with ${item.teamB} ${score} ${item.court}`
  }
  return `${item.teamA} beat ${item.teamB} ${score} ${item.court}`
}

type GroupedStanding = { rank: number; isFirstInGroup: boolean; players: MatchplayPlayer[] }

function groupStandings(standings: MatchplayPlayer[]): GroupedStanding[] {
  const groups: GroupedStanding[] = []
  let rank = 1
  let i = 0
  while (i < standings.length) {
    const p = standings[i]
    const groupPlayers = [p]
    while (i + 1 < standings.length) {
      const next = standings[i + 1]
      if (next.total_points === p.total_points && next.game_difference === p.game_difference) {
        groupPlayers.push(next)
        i++
      } else break
    }
    groups.push({ rank, isFirstInGroup: true, players: groupPlayers })
    rank += groupPlayers.length
    i++
  }
  return groups
}

export default function MatchplayBoardPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<MatchplayEvent | null>(null)
  const [players, setPlayers] = useState<MatchplayPlayer[]>([])
  const [standings, setStandings] = useState<MatchplayPlayer[]>([])
  const [rounds, setRounds] = useState<MatchplayRound[]>([])
  const [currentRound, setCurrentRound] = useState<MatchplayRound | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now())
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([])
  const [activityFeedIndex, setActivityFeedIndex] = useState(0)
  const [podiumAnimated, setPodiumAnimated] = useState(false)
  const feedMatchIdsRef = useRef<Set<string>>(new Set())

  const loadEvent = useCallback(async () => {
    if (!eventId) return
    const result = await callMatchplayEvent({ action: 'get', event_id: eventId })
    if (result.event) setEvent(result.event)
    else setError('Event not found')
  }, [eventId])

  const loadStandings = useCallback(async () => {
    if (!eventId) return
    const result = await callMatchplayPlayer({ action: 'standings', event_id: eventId })
    setStandings(result.standings ?? [])
  }, [eventId])

  const loadPlayers = useCallback(async () => {
    if (!eventId) return
    const result = await callMatchplayPlayer({ action: 'list', event_id: eventId })
    setPlayers(result.players ?? [])
  }, [eventId])

  const loadRounds = useCallback(async () => {
    if (!eventId) return
    const listResult = await callMatchplayRound({ action: 'list_rounds', event_id: eventId })
    const list = listResult.rounds ?? []
    if (list.length === 0) {
      setRounds([])
      setCurrentRound(null)
      return
    }
    const sorted = list.sort((a: MatchplayRound, b: MatchplayRound) => (b.round_number ?? 0) - (a.round_number ?? 0))
    const withMatches = await Promise.all(
      sorted.map(async (r: MatchplayRound) => {
        const getResult = await callMatchplayRound({ action: 'get_round', round_id: r.id })
        return { ...r, matches: getResult.round?.matches ?? [] }
      })
    )
    setRounds(withMatches)
    setCurrentRound(withMatches[0])
  }, [eventId])

  const loadAll = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    setError(null)
    try {
      await loadEvent()
      await loadStandings()
      await loadPlayers()
      await loadRounds()
      setLastUpdated(Date.now())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load event data'
      setError(message.includes('fetch') ? 'Network error. Check your connection and that Supabase Edge Functions are reachable.' : message)
    } finally {
      setLoading(false)
    }
  }, [eventId, loadEvent, loadStandings, loadPlayers, loadRounds])

  useEffect(() => {
    if (!eventId) return
    feedMatchIdsRef.current = new Set()
    loadAll()
  }, [eventId, loadAll])

  // Realtime subscriptions
  useEffect(() => {
    if (!eventId) return

    const chPlayers = supabase.channel(`board-players-${eventId}`)
    ;(chPlayers as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_players', filter: `event_id=eq.${eventId}` },
      () => {
        loadStandings()
        loadPlayers()
        setLastUpdated(Date.now())
      }
    )
    chPlayers.subscribe()

    const chMatches = supabase.channel(`board-matches-${eventId}`)
    ;(chMatches as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_matches', filter: `event_id=eq.${eventId}` },
      () => {
        loadRounds()
        loadStandings()
        setLastUpdated(Date.now())
      }
    )
    chMatches.subscribe()

    const chEvents = supabase.channel(`board-events-${eventId}`)
    ;(chEvents as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_events', filter: `id=eq.${eventId}` },
      () => {
        loadEvent()
        loadRounds()
        setLastUpdated(Date.now())
      }
    )
    chEvents.subscribe()

    const chRounds = supabase.channel(`board-rounds-${eventId}`)
    ;(chRounds as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_rounds', filter: `event_id=eq.${eventId}` },
      () => {
        loadRounds()
        setLastUpdated(Date.now())
      }
    )
    chRounds.subscribe()

    return () => {
      supabase.removeChannel(chPlayers)
      supabase.removeChannel(chMatches)
      supabase.removeChannel(chEvents)
      supabase.removeChannel(chRounds)
    }
  }, [eventId, loadEvent, loadStandings, loadPlayers, loadRounds])

  // Keep-alive: update document title every 30s to prevent TV sleep
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(Date.now())
      if (typeof document !== 'undefined') {
        document.title = event?.name ? `${event.name} - PalaPoint` : 'PalaPoint Matchplay'
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [event?.name])

  // Populate activity feed from completed matches
  useEffect(() => {
    const newItems: ActivityFeedItem[] = []
    for (const round of rounds) {
      for (const match of round.matches ?? []) {
        if (match.status !== 'completed' || feedMatchIdsRef.current.has(match.id)) continue
        const teamA = [match.team_a_player_1_name, match.team_a_player_2_name].filter(Boolean).join(' + ') || 'Team A'
        const teamB = [match.team_b_player_1_name, match.team_b_player_2_name].filter(Boolean).join(' + ') || 'Team B'
        const scoreA = match.team_a_score ?? 0
        const scoreB = match.team_b_score ?? 0
        const completedAt = match.updated_at ? new Date(match.updated_at).getTime() : Date.now()
        feedMatchIdsRef.current.add(match.id)
        newItems.push({ id: match.id, teamA, teamB, scoreA, scoreB, court: match.court_label, completedAt })
      }
    }
    if (newItems.length > 0) {
      setActivityFeed((prev) => [...newItems, ...prev].slice(0, 10))
    }
  }, [rounds])

  // Cycle activity feed every 6 seconds
  useEffect(() => {
    if (activityFeed.length <= 1) return
    const interval = setInterval(() => {
      setActivityFeedIndex((i) => (i + 1) % activityFeed.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [activityFeed.length])

  // Podium animation when entering completed state
  useEffect(() => {
    if (event?.status === 'completed' && !podiumAnimated) {
      setPodiumAnimated(true)
    }
  }, [event?.status, podiumAnimated])

  if (loading && !event) {
    return (
      <div className="board-container">
        <p className="board-loading">Loading...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="board-container">
        <p className="board-error">{error || 'Event not found'}</p>
      </div>
    )
  }

  const isSetup = event.status === 'setup'
  const isCompleted = event.status === 'completed'
  const isLive = event.status === 'in_progress'

  // Setup state
  if (isSetup) {
    return (
      <div className="board-container board-setup">
        <div className="board-setup-content">
          <div className="board-brand">PalaPoint</div>
          <h1 className="board-event-name">{event.name}</h1>
          <p className="board-event-date">{formatEventDate(event.created_at)}</p>
          <div className="board-starting-soon">
            <span className="board-pulse-dot" aria-hidden />
            <span>STARTING SOON</span>
          </div>
          <div className="board-players-card">
            <div className="board-players-title">PLAYERS</div>
            <div className="board-players-grid">
              {players
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((p) => (
                  <span key={p.id} className="board-player-name">
                    {p.name}
                  </span>
                ))}
            </div>
            <div className="board-players-count">
              {players.length} player{players.length !== 1 ? 's' : ''} registered
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Completed state
  if (isCompleted) {
    const groups = groupStandings(standings)
    const firstGroup = groups[0]
    const secondGroup = groups[1]
    const thirdGroup = groups[2]
    const winners = firstGroup?.players ?? []
    const topPoints = winners[0]?.total_points ?? 0
    const hasWinners = winners.length > 0

    return (
      <div className="board-container board-completed">
        <div className="board-header">
          <h1 className="board-header-title">{event.name}</h1>
          <div className="board-badge board-badge-final">
            <span className="board-badge-dot board-badge-dot-final" aria-hidden />
            <span>FINAL</span>
          </div>
        </div>

        <div className={`board-main board-main-single ${podiumAnimated ? 'board-podium-visible' : ''}`}>
          <div className="board-winner-section">
            {hasWinners && (
              <>
                <div className="board-winner-trophy">🏆</div>
                <div className="board-winner-label">WINNER</div>
                <div className="board-winner-card">
                  <div className="board-winner-names">
                    {winners.map((w) => (
                      <span key={w.id} className="board-winner-name">
                        {w.name}
                      </span>
                    ))}
                  </div>
                  <div className="board-winner-stats">
                    {topPoints} pts • GD {(winners[0]?.game_difference ?? 0) >= 0 ? '+' : ''}{winners[0]?.game_difference ?? 0}
                  </div>
                </div>
              </>
            )}
            <div className="board-podium">
              <div className="board-podium-platform board-podium-2nd">
                <div className="board-podium-label">2nd</div>
                <div className="board-podium-names">
                  {(secondGroup?.players ?? []).map((p) => (
                    <span key={p.id}>{p.name}</span>
                  ))}
                </div>
                <div className="board-podium-medal">🥈</div>
              </div>
              <div className="board-podium-platform board-podium-1st">
                <div className="board-podium-label">1st</div>
                <div className="board-podium-names">
                  {(firstGroup?.players ?? []).map((p) => (
                    <span key={p.id}>{p.name}</span>
                  ))}
                </div>
                <div className="board-podium-medal">🥇</div>
              </div>
              <div className="board-podium-platform board-podium-3rd">
                <div className="board-podium-label">3rd</div>
                <div className="board-podium-names">
                  {(thirdGroup?.players ?? []).map((p) => (
                    <span key={p.id}>{p.name}</span>
                  ))}
                </div>
                <div className="board-podium-medal">🥉</div>
              </div>
            </div>
            <div className="board-winner-divider" />
            <div className="board-standings-title">FINAL STANDINGS</div>
            <table className="board-standings">
              <thead>
                <tr>
                  <th className="board-th-rank">#</th>
                  <th className="board-th-player">Player</th>
                  <th className="board-th-num">P</th>
                  <th className="board-th-num">W</th>
                  <th className="board-th-num">D</th>
                  <th className="board-th-num">L</th>
                  <th className="board-th-num">GD</th>
                  <th className="board-th-pts">Pts</th>
                </tr>
              </thead>
              <tbody>
                {groups.flatMap((g) =>
                  g.players.map((s, idx) => (
                    <tr key={s.id} className={`${g.rank <= 3 ? `board-rank-${g.rank}` : ''} ${idx > 0 ? 'board-tie-cont' : ''}`}>
                      <td className="board-td-rank board-td-rank-cell">
                        {idx === 0 ? (g.rank <= 3 ? ['🥇', '🥈', '🥉'][g.rank - 1] : g.rank) : <span className="board-tie-connector">└</span>}
                      </td>
                      <td className="board-td-player">{s.name}</td>
                      <td className="board-td-num">{s.matches_played ?? 0}</td>
                      <td className="board-td-num">{s.matches_won ?? 0}</td>
                      <td className="board-td-num">{s.matches_drawn ?? 0}</td>
                      <td className="board-td-num">{s.matches_lost ?? 0}</td>
                      <td className="board-td-num">{s.game_difference ?? 0}</td>
                      <td className="board-td-pts">{s.total_points ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="board-footer">
          {rounds.length} round{rounds.length !== 1 ? 's' : ''} • {players.length} players •{' '}
          {getGameModeText(event.game_mode)} • {getMatchFormatText(event)}
        </div>
      </div>
    )
  }

  // In Progress state
  const totalRounds = rounds.length
  const roundNum = currentRound?.round_number ?? 1

  return (
    <div className="board-container board-live">
      <div className="board-header">
        <h1 className="board-header-title">{event.name}</h1>
        <div className="board-round-indicator">
          ROUND {roundNum} of {totalRounds || 1}
        </div>
        <div className="board-badge board-badge-live">
          <span className="board-badge-dot board-badge-dot-live" aria-hidden />
          <span>LIVE</span>
        </div>
      </div>

      <div className="board-main">
        <div className="board-panel board-leaderboard">
          <div className="board-panel-title">LEADERBOARD</div>
          <table className="board-standings">
            <thead>
              <tr>
                <th className="board-th-rank">#</th>
                <th className="board-th-player">Player</th>
                <th className="board-th-num">P</th>
                <th className="board-th-num">W</th>
                <th className="board-th-num">D</th>
                <th className="board-th-num">L</th>
                <th className="board-th-num">GD</th>
                <th className="board-th-pts">Pts</th>
              </tr>
            </thead>
            <tbody>
              {groupStandings(standings).flatMap((g) =>
                g.players.map((s, idx) => (
                  <tr key={s.id} className={`${g.rank <= 3 ? `board-rank-${g.rank}` : ''} ${idx > 0 ? 'board-tie-cont' : ''}`}>
                    <td className="board-td-rank board-td-rank-cell">
                      {idx === 0 ? (g.rank <= 3 ? ['🥇', '🥈', '🥉'][g.rank - 1] : g.rank) : <span className="board-tie-connector">└</span>}
                    </td>
                    <td className="board-td-player">{s.name}</td>
                    <td className="board-td-num">{s.matches_played ?? 0}</td>
                    <td className="board-td-num">{s.matches_won ?? 0}</td>
                    <td className="board-td-num">{s.matches_drawn ?? 0}</td>
                    <td className="board-td-num">{s.matches_lost ?? 0}</td>
                    <td className="board-td-num">{s.game_difference ?? 0}</td>
                    <td className="board-td-pts">{s.total_points ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="board-panel board-fixtures">
          <div className="board-panel-title">ROUND {roundNum}</div>
          <div className="board-fixture-list">
            {(currentRound?.matches ?? []).length === 0 ? (
              <div className="board-fixtures-empty">
                {rounds.length === 0 ? 'No rounds started yet' : 'No matches this round'}
              </div>
            ) : (currentRound?.matches ?? []).map((match) => {
              const teamA = [match.team_a_player_1_name, match.team_a_player_2_name].filter(Boolean).join(' + ') || '—'
              const teamB = [match.team_b_player_1_name, match.team_b_player_2_name].filter(Boolean).join(' + ') || '—'
              const isCompleted = match.status === 'completed'
              const scoreA = match.team_a_score ?? 0
              const scoreB = match.team_b_score ?? 0
              const teamAWins = scoreA > scoreB
              const teamBWins = scoreB > scoreA

              return (
                <div key={match.id} className="board-fixture">
                  <div className="board-fixture-court">{match.court_label}</div>
                  <div className="board-fixture-teams">
                    <div className={`board-fixture-team ${teamAWins ? 'board-fixture-team-winner' : ''}`}>
                      {teamA}
                      {isCompleted && <span className="board-fixture-score">{scoreA}</span>}
                    </div>
                    <div className="board-fixture-vs">vs</div>
                    <div className={`board-fixture-team ${teamBWins ? 'board-fixture-team-winner' : ''}`}>
                      {teamB}
                      {isCompleted && <span className="board-fixture-score">{scoreB}</span>}
                    </div>
                  </div>
                  {!isCompleted && (
                    <div className="board-fixture-status">
                      <span className="board-fixture-status-dot" aria-hidden />
                      In Progress
                    </div>
                  )}
                  {isCompleted && <span className="board-fixture-check">✓</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {activityFeed.length > 0 && (
        <div className="board-activity-feed">
          <span className="board-activity-dot" aria-hidden />
          {formatFeedItem(activityFeed[activityFeedIndex % activityFeed.length])} {timeAgo(activityFeed[activityFeedIndex % activityFeed.length].completedAt)}
        </div>
      )}

      <div className="board-footer">
        {getGameModeText(event.game_mode)} • {getMatchFormatText(event)} • {getScoringText(event)}
      </div>
    </div>
  )
}
