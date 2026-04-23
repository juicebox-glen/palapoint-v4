'use client'

// TODO: Consider venue-scoped board route (/matchplay/[company]/[venue]/board) that auto-shows
// the active event or idle state. Current route requires an event ID.

import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
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
  court_count?: number
  format?: string
  venue?: {
    name?: string
    company?: { name?: string; branding?: { logo_url?: string | null } }
  }
}

interface MatchplayPlayer {
  id: string
  event_id: string
  name: string
  photo_url?: string | null
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
  team_a_player_1_id?: string
  team_a_player_2_id?: string
  team_b_player_1_id?: string
  team_b_player_2_id?: string
  team_a_player_1_name?: string
  team_a_player_2_name?: string
  team_b_player_1_name?: string
  team_b_player_2_name?: string
  team_a_player_1_photo_url?: string | null
  team_a_player_2_photo_url?: string | null
  team_b_player_1_photo_url?: string | null
  team_b_player_2_photo_url?: string | null
  status: string
  team_a_score: number | null
  team_b_score: number | null
  updated_at?: string
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

function formatEventKindLabel(event: MatchplayEvent): string {
  if (event.format?.trim()) {
    return event.format.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return 'Americano'
}

function formatMatchPointsSummary(event: MatchplayEvent): string {
  if (event.match_format === 'first_to_points') {
    return `${event.match_target_score ?? 32} pts per match`
  }
  if (event.match_format === 'timed') {
    return `${event.match_duration_minutes ?? 10} min per match`
  }
  const t = getMatchFormatText(event)
  return t || '—'
}

function getCourtCountForBoard(event: MatchplayEvent, rounds: MatchplayRound[]): number {
  if (event.court_count != null && event.court_count > 0) return event.court_count
  const matches = rounds[0]?.matches ?? []
  const labels = new Set(matches.map((m) => m.court_label).filter(Boolean))
  if (labels.size > 0) return labels.size
  return 1
}

function buildBoardFooterLeft(event: MatchplayEvent, rounds: MatchplayRound[]): string {
  const kind = formatEventKindLabel(event)
  const mid = formatMatchPointsSummary(event)
  const n = getCourtCountForBoard(event, rounds)
  const courts = `${n} court${n !== 1 ? 's' : ''}`
  return `${kind} · ${mid} · ${courts}`
}

function BoardHeaderShell({ event, headerRight }: { event: MatchplayEvent; headerRight: ReactNode }) {
  const logoUrl = event.venue?.company?.branding?.logo_url
  const logoAlt = event.venue?.company?.name || event.venue?.name || 'Venue'

  return (
    <header className="board-header">
      <div className="board-header-logo">
        {logoUrl ? (
          <img src={logoUrl} alt={logoAlt} className="board-venue-logo" />
        ) : (
          <span className="board-venue-name">{event.venue?.name || 'PalaPoint'}</span>
        )}
      </div>
      <h1 className="board-header-title">{event.name}</h1>
      <div className="board-header-right">{headerRight}</div>
    </header>
  )
}

function BoardFooterShell({ left }: { left: ReactNode }) {
  return (
    <footer className="board-footer">
      <div className="board-footer-left">{left}</div>
      <div className="board-footer-right">
        <span className="board-footer-credit">palapoint</span>
      </div>
    </footer>
  )
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

type LiveStandingRow = { player: MatchplayPlayer; rank: number; tiedGroup: boolean }

function flattenLiveStandingsRows(standings: MatchplayPlayer[]): LiveStandingRow[] {
  const groups = groupStandings(standings)
  const rows: LiveStandingRow[] = []
  for (const g of groups) {
    const tiedGroup = g.players.length > 1
    for (const p of g.players) {
      rows.push({ player: p, rank: g.rank, tiedGroup })
    }
  }
  return rows
}

function formatGameDiff(gd: number): string {
  if (gd > 0) return `+${gd}`
  return String(gd)
}

function namesOnPitchForMatches(matches: MatchplayMatch[]): Set<string> {
  const s = new Set<string>()
  for (const m of matches) {
    for (const n of [m.team_a_player_1_name, m.team_a_player_2_name, m.team_b_player_1_name, m.team_b_player_2_name]) {
      const t = n?.trim()
      if (t) s.add(t)
    }
  }
  return s
}

function getRestingPlayers(players: MatchplayPlayer[], matches: MatchplayMatch[]): MatchplayPlayer[] {
  if (players.length === 0) return []
  const onPitch = namesOnPitchForMatches(matches)
  return players.filter((p) => !onPitch.has(p.name.trim()))
}

function getRoundByNumber(rounds: MatchplayRound[], n: number): MatchplayRound | null {
  return rounds.find((r) => r.round_number === n) ?? null
}

function boardPlayerFirstName(full: string | undefined): string {
  if (!full?.trim()) return ''
  return full.trim().split(/\s+/)[0] ?? ''
}

function BoardPlayerPhoto({
  name,
  photoUrl,
  size = 'md',
}: {
  name: string
  photoUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass = `board-player-photo--${size}`
  if (photoUrl) {
    return <img src={photoUrl} alt="" className={`board-player-photo ${sizeClass}`} />
  }
  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className={`board-player-photo board-player-photo--initials ${sizeClass}`} aria-hidden>
      {initials || '—'}
    </div>
  )
}

function BoardFixtureCard({ match }: { match: MatchplayMatch }) {
  const teamAPlayers: { name?: string; photo?: string | null }[] = [
    { name: match.team_a_player_1_name, photo: match.team_a_player_1_photo_url },
    { name: match.team_a_player_2_name, photo: match.team_a_player_2_photo_url },
  ].filter((p) => p.name?.trim())
  const teamBPlayers: { name?: string; photo?: string | null }[] = [
    { name: match.team_b_player_1_name, photo: match.team_b_player_1_photo_url },
    { name: match.team_b_player_2_name, photo: match.team_b_player_2_photo_url },
  ].filter((p) => p.name?.trim())

  const teamA =
    teamAPlayers.map((p) => boardPlayerFirstName(p.name)).filter(Boolean).join(' + ') || '—'
  const teamB =
    teamBPlayers.map((p) => boardPlayerFirstName(p.name)).filter(Boolean).join(' + ') || '—'
  const isMatchCompleted = match.status === 'completed'
  const scoreA = match.team_a_score ?? 0
  const scoreB = match.team_b_score ?? 0
  const teamAWins = scoreA > scoreB
  const teamBWins = scoreB > scoreA

  return (
    <div className="board-fixture">
      <div className="board-fixture-court">{match.court_label}</div>
      <div className="board-fixture-teams">
        <div className={`board-fixture-team ${teamAWins ? 'board-fixture-team-winner' : ''}`}>
          <div className="board-fixture-team-main">
            <div className="board-fixture-photos">
              {teamAPlayers.map((p, i) => (
                <BoardPlayerPhoto key={`a-${i}`} name={p.name ?? ''} photoUrl={p.photo} size="sm" />
              ))}
            </div>
            <span className="board-fixture-names">{teamA}</span>
          </div>
          {isMatchCompleted ? <span className="board-fixture-score">{scoreA}</span> : null}
        </div>
        <div className="board-fixture-vs">vs</div>
        <div className={`board-fixture-team ${teamBWins ? 'board-fixture-team-winner' : ''}`}>
          <div className="board-fixture-team-main">
            <div className="board-fixture-photos">
              {teamBPlayers.map((p, i) => (
                <BoardPlayerPhoto key={`b-${i}`} name={p.name ?? ''} photoUrl={p.photo} size="sm" />
              ))}
            </div>
            <span className="board-fixture-names">{teamB}</span>
          </div>
          {isMatchCompleted ? <span className="board-fixture-score">{scoreB}</span> : null}
        </div>
      </div>
      {!isMatchCompleted && (
        <div className="board-fixture-status">
          <span className="board-fixture-status-dot" aria-hidden />
          In Progress
        </div>
      )}
      {isMatchCompleted && <span className="board-fixture-check">✓</span>}
    </div>
  )
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
  const [podiumAnimated, setPodiumAnimated] = useState(false)
  const [flashingRowIds, setFlashingRowIds] = useState<Set<string>>(new Set())
  const standingsSnapshotRef = useRef<Map<string, { tp: number; gd: number }> | null>(null)

  const loadEvent = useCallback(async () => {
    if (!eventId) return
    const result = await callMatchplayEvent({ action: 'get', event_id: eventId })
    if (result.event) {
      setEvent(result.event)
      setError(null)
    } else {
      setEvent(null)
      setError('Event not found')
    }
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load event data'
      setError(message.includes('fetch') ? 'Network error. Check your connection and that Supabase Edge Functions are reachable.' : message)
    } finally {
      setLoading(false)
    }
  }, [eventId, loadEvent, loadStandings, loadPlayers, loadRounds])

  useEffect(() => {
    if (!eventId) return
    standingsSnapshotRef.current = null
    setFlashingRowIds(new Set())
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
      }
    )
    chEvents.subscribe()

    const chRounds = supabase.channel(`board-rounds-${eventId}`)
    ;(chRounds as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_rounds', filter: `event_id=eq.${eventId}` },
      () => {
        loadRounds()
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
      if (typeof document !== 'undefined') {
        document.title = event?.name ? `${event.name} - PalaPoint` : 'PalaPoint Matchplay'
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [event?.name])

  // Podium animation when entering completed state
  useEffect(() => {
    if (event?.status === 'completed' && !podiumAnimated) {
      setPodiumAnimated(true)
    }
  }, [event?.status, podiumAnimated])

  // In-play: flash standings rows when points, differential, or sort position changes (realtime)
  useEffect(() => {
    if (!event || event.status !== 'in_progress') {
      if (standings.length > 0) {
        standingsSnapshotRef.current = new Map(
          standings.map((p) => [p.id, { tp: p.total_points, gd: p.game_difference }])
        )
      }
      return
    }

    const prev = standingsSnapshotRef.current
    const changed = new Set<string>()
    if (prev && standings.length > 0) {
      standings.forEach((p) => {
        const old = prev.get(p.id)
        if (old && (old.tp !== p.total_points || old.gd !== p.game_difference)) {
          changed.add(p.id)
        }
      })
    }

    standingsSnapshotRef.current = new Map(
      standings.map((p) => [p.id, { tp: p.total_points, gd: p.game_difference }])
    )

    if (changed.size === 0) return

    setFlashingRowIds(changed)
    const t = window.setTimeout(() => setFlashingRowIds(new Set()), 1000)
    return () => window.clearTimeout(t)
  }, [standings, event])

  if (loading && !event) {
    return (
      <div className="board-container">
        <p className="board-loading">Loading...</p>
      </div>
    )
  }

  if (!loading && !event) {
    return (
      <div className="board-container board-idle">
        <div className="board-idle-content">
          <div className="board-idle-logo">
            <span className="board-idle-brand">PalaPoint</span>
          </div>
          <p className="board-idle-message">Next event coming soon</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  const isSetup = event.status === 'setup'
  const isCompleted = event.status === 'completed'

  // Setup state — same two-column shell as live (V2 pre-start)
  if (isSetup) {
    const round1 = getRoundByNumber(rounds, 1)
    const round1Matches = round1?.matches ?? []
    const restingSetup = getRestingPlayers(players, round1Matches)
    const totalRoundsSetup = rounds.length

    return (
      <div className="board-container board-live">
        <BoardHeaderShell
          event={event}
          headerRight={
            <>
              <div className="board-round-indicator">
                ROUND 1 of {totalRoundsSetup > 0 ? totalRoundsSetup : 1}
              </div>
              <div className="board-badge board-badge-starting">
                <span className="board-badge-dot board-badge-dot-starting" aria-hidden />
                <span>STARTING SOON</span>
              </div>
            </>
          }
        />

        <div className="board-main board-main-split">
          <div className="board-panel board-fixtures">
            <div className="board-panel-title">ROUND 1 FIXTURES</div>
            <div className="board-fixture-list">
              {round1Matches.length === 0 ? (
                <div className="board-fixtures-empty">
                  {rounds.length === 0 ? 'No fixtures yet — round 1 will appear when generated' : 'No matches in round 1'}
                </div>
              ) : (
                round1Matches.map((match) => <BoardFixtureCard key={match.id} match={match} />)
              )}
            </div>
            {restingSetup.length > 0 && (
              <div className="board-resting">
                Resting this round: {restingSetup.map((p) => p.name).join(', ')}
              </div>
            )}
          </div>

          <div className="board-panel board-standings">
            <div className="board-panel-title">STANDINGS</div>
            <div className="board-standings-empty">Standings will appear after Round 1</div>
          </div>
        </div>

        <BoardFooterShell left={buildBoardFooterLeft(event, rounds)} />
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
        <BoardHeaderShell
          event={event}
          headerRight={
            <div className="board-badge board-badge-final">
              <span className="board-badge-dot board-badge-dot-final" aria-hidden />
              <span>FINAL</span>
            </div>
          }
        />

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
            <table className="board-standings-table">
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
                      <td
                        className={`board-td-rank board-td-rank-cell ${idx === 0 && g.rank <= 3 ? 'board-td-rank-medal' : ''}`}
                      >
                        {idx === 0 ? (g.rank <= 3 ? ['🥇', '🥈', '🥉'][g.rank - 1] : g.rank) : <span className="board-tie-connector">└</span>}
                      </td>
                      <td className="board-td-player">
                        <div className="board-standings-player-cell">
                          <BoardPlayerPhoto name={s.name} photoUrl={s.photo_url} size="sm" />
                          <span className="board-standings-player-name">{s.name}</span>
                        </div>
                      </td>
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

        <BoardFooterShell left={buildBoardFooterLeft(event, rounds)} />
      </div>
    )
  }

  // In Progress state
  const totalRounds = rounds.length
  const roundNum = currentRound?.round_number ?? 1
  const liveMatches = currentRound?.matches ?? []
  const restingLive = getRestingPlayers(players, liveMatches)

  return (
    <div className="board-container board-live">
      <BoardHeaderShell
        event={event}
        headerRight={
          <>
            <div className="board-round-indicator">
              ROUND {roundNum} of {totalRounds || 1}
            </div>
            <div className="board-badge board-badge-live">
              <span className="board-badge-dot board-badge-dot-live" aria-hidden />
              <span>LIVE</span>
            </div>
          </>
        }
      />

      <div className="board-main board-main-split">
        <div className="board-panel board-fixtures">
          <div className="board-panel-title">ROUND {roundNum} FIXTURES</div>
          <div className="board-fixture-list">
            {liveMatches.length === 0 ? (
              <div className="board-fixtures-empty">
                {rounds.length === 0 ? 'No rounds started yet' : 'No matches this round'}
              </div>
            ) : (
              liveMatches.map((match) => <BoardFixtureCard key={match.id} match={match} />)
            )}
          </div>
          {restingLive.length > 0 && (
            <div className="board-resting">Resting this round: {restingLive.map((p) => p.name).join(', ')}</div>
          )}
        </div>

        <div className="board-panel board-standings">
          <div className="board-panel-title">STANDINGS</div>
          <table className="board-standings-table board-standings-table--live">
            <thead>
              <tr>
                <th className="board-th-rank">#</th>
                <th className="board-th-player">Player</th>
                <th className="board-th-points">P</th>
                <th className="board-th-diff">+/-</th>
              </tr>
            </thead>
            <tbody>
              {flattenLiveStandingsRows(standings).map(({ player: s, rank, tiedGroup }) => {
                const flash = flashingRowIds.has(s.id)
                const rowClass = ['board-standings-row', tiedGroup ? 'board-row-tied' : '', flash ? 'board-row-flash' : '']
                  .filter(Boolean)
                  .join(' ')
                return (
                  <tr key={s.id} className={rowClass}>
                    <td className="board-td-rank board-td-rank-cell">{rank}</td>
                    <td className="board-td-player">
                      <div className="board-standings-player-cell">
                        <BoardPlayerPhoto name={s.name} photoUrl={s.photo_url} size="sm" />
                        <span className="board-standings-player-name">{s.name}</span>
                      </div>
                    </td>
                    <td className="board-td-points">{s.total_points ?? 0}</td>
                    <td className="board-td-diff">{formatGameDiff(s.game_difference ?? 0)}</td>
                  </tr>
                )
              })}
              {restingLive.map((p) => (
                <tr
                  key={`rest-standings-${p.id}`}
                  className="board-standings-row board-row-resting"
                  aria-label={`${p.name}, resting this round`}
                >
                  <td className="board-td-rank board-td-rank-cell board-td-rank-resting" aria-hidden>
                    ·
                  </td>
                  <td className="board-td-player">
                    <div className="board-standings-player-cell">
                      <BoardPlayerPhoto name={p.name} photoUrl={p.photo_url} size="sm" />
                      <span className="board-standings-player-name">{p.name}</span>
                    </div>
                  </td>
                  <td className="board-td-points">0</td>
                  <td className="board-td-diff">0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BoardFooterShell left={buildBoardFooterLeft(event, rounds)} />
    </div>
  )
}
