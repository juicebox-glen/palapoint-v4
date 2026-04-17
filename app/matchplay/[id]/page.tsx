'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import '@/app/styles/matchplay.css'
import '@/app/styles/setup-form.css'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SETTINGS_KEY = 'palapoint_matchplay_settings'

interface MatchplayEvent {
  id: string
  name: string
  status: string
  venue_id: string
  format?: string
  match_target_score?: number
  court_count?: number
  court_labels?: string[]
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
  round_id: string
  event_id: string
  court_label: string
  team_a_player_1_id: string
  team_a_player_2_id: string
  team_b_player_1_id: string
  team_b_player_2_id: string
  team_a_player_1_name?: string
  team_a_player_2_name?: string
  team_b_player_1_name?: string
  team_b_player_2_name?: string
  status: string
  team_a_score: number | null
  team_b_score: number | null
  result: string | null
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

interface MatchplaySettings {
  courtCount?: number
  maxScore?: number
  maxScoreCustom?: number
  rounds: number
  roundsCustom?: number
}

function loadSettings(): MatchplaySettings | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) return JSON.parse(stored) as MatchplaySettings
  } catch (_) {}
  return null
}

function getTotalRoundsAmericano(playerCount: number): number {
  if (playerCount < 4) return 0
  return playerCount % 2 === 0 ? playerCount - 1 : playerCount
}

function getTotalRounds(): number {
  const s = loadSettings()
  if (!s) return 4
  return s.rounds === 0 ? (s.roundsCustom ?? 4) : s.rounds
}

async function callMatchplayEvent(body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/matchplay-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function callMatchplayPlayer(body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/matchplay-player`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function callMatchplayRound(body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/matchplay-round`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

/** Americano: everyone partners with everyone once. Circle method. */
function generateAmericanoPairings(
  playerIds: string[],
  courtLabels: string[]
): { roundNumber: number; matches: { court_label: string; team_a: string[]; team_b: string[] }[]; resting?: string }[] {
  const result: { roundNumber: number; matches: { court_label: string; team_a: string[]; team_b: string[] }[]; resting?: string }[] = []
  const n = playerIds.length
  const hasBye = n % 2 !== 0
  const playerList = hasBye ? [...playerIds, null as unknown as string] : [...playerIds]
  const total = playerList.length
  const fixed = playerList[0]!
  const rotating = playerList.slice(1)
  const numCourts = Math.max(1, Math.floor(total / 4))
  const courts = courtLabels.length > 0 ? courtLabels.slice(0, numCourts) : Array.from({ length: numCourts }, (_, i) => `Court ${i + 1}`)

  for (let round = 0; round < total - 1; round++) {
    const currentOrder = [fixed, ...rotating]
    const pairs: [string, string][] = []
    let resting: string | undefined

    for (let i = 0; i < total / 2; i++) {
      const p1 = currentOrder[i]
      const p2 = currentOrder[total - 1 - i]
      if (p1 != null && p2 != null) {
        pairs.push([p1, p2])
      } else {
        resting = (p1 ?? p2) as string
      }
    }

    const matches: { court_label: string; team_a: string[]; team_b: string[] }[] = []
    for (let i = 0; i < pairs.length - 1; i += 2) {
      const courtIdx = Math.floor(i / 2) % courts.length
      matches.push({
        court_label: courts[courtIdx] ?? `Court ${courtIdx + 1}`,
        team_a: pairs[i]!,
        team_b: pairs[i + 1]!,
      })
    }

    result.push({ roundNumber: round + 1, matches, resting })

    rotating.push(rotating.shift()!)
  }

  return result
}

export default function MatchplayEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<MatchplayEvent | null>(null)
  const [players, setPlayers] = useState<MatchplayPlayer[]>([])
  const [rounds, setRounds] = useState<MatchplayRound[]>([])
  const [standings, setStandings] = useState<MatchplayPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null)
  const [draftScores, setDraftScores] = useState<Record<string, { a: number; b: number }>>({})
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null)

  const [showPlayersModal, setShowPlayersModal] = useState(false)
  const [showStandingsModal, setShowStandingsModal] = useState(false)
  const [showEditMatchModal, setShowEditMatchModal] = useState<MatchplayMatch | null>(null)
  const [showEndEventMenu, setShowEndEventMenu] = useState(false)

  const [newPlayerName, setNewPlayerName] = useState('')
  const [editMatchAssignments, setEditMatchAssignments] = useState<{ a1: string; a2: string; b1: string; b2: string }>({ a1: '', a2: '', b1: '', b2: '' })

  const roundTabsRef = useRef<HTMLDivElement>(null)
  const pairingGeneratedRef = useRef(false)

  const getCourtLabels = useCallback(() => {
    const labels = event?.court_labels
    if (labels && labels.length > 0) return labels
    const count = event?.court_count ?? 2
    return Array.from({ length: count }, (_, i) => `Court ${i + 1}`)
  }, [event])

  const loadEvent = useCallback(async () => {
    const result = await callMatchplayEvent({ action: 'get', event_id: eventId })
    if (result.event) setEvent(result.event)
    else setError('Event not found')
  }, [eventId])

  const loadPlayers = useCallback(async () => {
    const result = await callMatchplayPlayer({ action: 'list', event_id: eventId })
    setPlayers(result.players ?? [])
  }, [eventId])

  const loadRounds = useCallback(async () => {
    const listResult = await callMatchplayRound({ action: 'list_rounds', event_id: eventId })
    const list = (listResult.rounds ?? []) as MatchplayRound[]
    const withMatches = await Promise.all(
      list.map(async (r) => {
        const getResult = await callMatchplayRound({ action: 'get_round', round_id: r.id })
        return { ...r, matches: getResult.round?.matches ?? [] } as MatchplayRound
      })
    )
    const sorted = withMatches.sort((a, b) => (a.round_number ?? 0) - (b.round_number ?? 0))
    setRounds(sorted)
  }, [eventId])

  const loadStandings = useCallback(async () => {
    const result = await callMatchplayPlayer({ action: 'standings', event_id: eventId })
    setStandings(result.standings ?? [])
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
    async function init() {
      setLoading(true)
      await loadEvent()
      await loadPlayers()
      await loadRounds()
      setLoading(false)
    }
    init()
  }, [eventId, loadEvent, loadPlayers, loadRounds])

  useEffect(() => {
    if (!event || !players.length || rounds.length > 0 || pairingGeneratedRef.current) return
    if (event.status !== 'setup' && event.status !== 'in_progress') return

    pairingGeneratedRef.current = true
    const courtLabels = getCourtLabels()
    const playerIds = players.map((p) => p.id)

    if (playerIds.length < 4) return

    const pairings = generateAmericanoPairings(playerIds, courtLabels)

    async function createRounds() {
      const listResult = await callMatchplayRound({ action: 'list_rounds', event_id: eventId })
      const existing = (listResult.rounds ?? []) as { round_number?: number }[]
      const existingNumbers = new Set(existing.map((r) => r.round_number ?? 0))

      for (const p of pairings) {
        if (existingNumbers.has(p.roundNumber)) continue
        const result = await callMatchplayRound({
          action: 'create_round',
          event_id: eventId,
          round_number: p.roundNumber,
          matches: p.matches,
        })
        if (!result.round) {
          if (result.error?.includes('duplicate') || result.error?.includes('unique')) {
            existingNumbers.add(p.roundNumber)
            continue
          }
          setError(result.error || 'Failed to create rounds')
          pairingGeneratedRef.current = false
          return
        }
        existingNumbers.add(p.roundNumber)
      }
      await loadRounds()
    }
    createRounds()
  }, [event, players, rounds.length, eventId, getCourtLabels, loadRounds])

  useEffect(() => {
    if (rounds.length === 0) return
    const ids = new Set(rounds.map((r) => r.id))
    if (!selectedRoundId || !ids.has(selectedRoundId)) {
      const current = rounds.find((r) => r.status !== 'completed') ?? rounds[rounds.length - 1]
      setSelectedRoundId(current?.id ?? rounds[0].id)
    }
  }, [rounds, selectedRoundId])

  useEffect(() => {
    if (!roundTabsRef.current || !selectedRoundId) return
    const el = roundTabsRef.current.querySelector(`[data-round-id="${selectedRoundId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedRoundId])

  useEffect(() => {
    if (!eventId) return
    const ch = supabase.channel(`matchplay-realtime-${eventId}`)
    ;(ch as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_players', filter: `event_id=eq.${eventId}` },
      () => {
        loadPlayers()
      }
    )
    ;(ch as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_matches', filter: `event_id=eq.${eventId}` },
      () => {
        loadRounds()
        loadStandings()
      }
    )
    ;(ch as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_rounds', filter: `event_id=eq.${eventId}` },
      () => {
        loadRounds()
      }
    )
    ch.subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [eventId, loadPlayers, loadRounds, loadStandings])

  const viewingRound = rounds.find((r) => r.id === selectedRoundId) ?? rounds[0]
  const currentRoundNumber = viewingRound ? Math.max(...rounds.filter((r) => r.status !== 'completed').map((r) => r.round_number ?? 0), 0) : 0
  const isAmericano = event?.format === 'americano'
  const maxScore = event?.match_target_score ?? 32
  const hasCompletedMatchInCurrentRound = viewingRound?.matches?.some((m) => m.status === 'completed') ?? false
  const allMatchesScoredInCurrentRound = (viewingRound?.matches?.length ?? 0) > 0 && (viewingRound?.matches ?? []).every((m) => m.status === 'completed')
  const isFinalRound = rounds.length > 0 && (viewingRound?.round_number ?? 0) >= (rounds[rounds.length - 1]?.round_number ?? 0)
  const canShowEndEvent = event?.status === 'in_progress' && (isFinalRound ? allMatchesScoredInCurrentRound : true)

  const handleStartEvent = async () => {
    if (!eventId) return
    setActionLoading('start')
    setError(null)
    const result = await callMatchplayEvent({ action: 'start', event_id: eventId })
    if (result.event) {
      setEvent(result.event)
      const firstRound = rounds.find((r) => (r.round_number ?? 0) === 1)
      if (firstRound) {
        await callMatchplayRound({ action: 'start_round', round_id: firstRound.id })
        await loadRounds()
      }
    }
    setActionLoading(null)
  }

  const handleCompleteEvent = async () => {
    if (!eventId) return
    if (!confirm('End event? Final standings will be locked.')) return
    setActionLoading('complete')
    setError(null)
    const result = await callMatchplayEvent({ action: 'complete', event_id: eventId })
    if (result.event) {
      setEvent(result.event)
      router.push('/matchplay')
    } else {
      setError(result.error || 'Failed to complete')
    }
    setActionLoading(null)
    setShowEndEventMenu(false)
  }

  const handleNextRound = async () => {
    if (!viewingRound || rounds.length === 0) return
    const idx = rounds.findIndex((r) => r.id === viewingRound.id)
    if (idx >= 0 && idx < rounds.length - 1) {
      const nextRound = rounds[idx + 1]!
      setSelectedRoundId(nextRound.id)
      if (nextRound.status === 'pending') {
        await callMatchplayRound({ action: 'start_round', round_id: nextRound.id })
        await loadRounds()
      }
    }
  }

  const handleEnterResult = async (matchId: string, teamAScore: number, teamBScore: number) => {
    setSubmittingMatchId(matchId)
    setError(null)
    const result = await callMatchplayRound({
      action: 'enter_result',
      match_id: matchId,
      team_a_score: teamAScore,
      team_b_score: teamBScore,
    })
    if (result.success) {
      setExpandedMatchId(null)
      setDraftScores((prev) => {
        const next = { ...prev }
        delete next[matchId]
        return next
      })
      loadRounds()
      loadStandings()
    } else {
      setError(result.error || 'Failed to save score')
    }
    setSubmittingMatchId(null)
  }

  const getAssignedInRound = (round: MatchplayRound, excludeMatchId?: string) => {
    const assigned = new Set<string>()
    for (const m of round.matches ?? []) {
      if (m.id === excludeMatchId) continue
      assigned.add(m.team_a_player_1_id)
      assigned.add(m.team_a_player_2_id)
      assigned.add(m.team_b_player_1_id)
      assigned.add(m.team_b_player_2_id)
    }
    return assigned
  }

  const getSitOutCounts = () => {
    const counts: Record<string, number> = {}
    for (const p of players) counts[p.id] = 0
    for (const r of rounds) {
      const playerIds = new Set<string>()
      for (const m of r.matches ?? []) {
        playerIds.add(m.team_a_player_1_id)
        playerIds.add(m.team_a_player_2_id)
        playerIds.add(m.team_b_player_1_id)
        playerIds.add(m.team_b_player_2_id)
      }
      for (const p of players) {
        if (!playerIds.has(p.id)) counts[p.id] = (counts[p.id] ?? 0) + 1
      }
    }
    return counts
  }

  const handleAddPlayer = async () => {
    if (!eventId || !newPlayerName.trim()) return
    setActionLoading('add')
    setError(null)
    const result = await callMatchplayPlayer({ action: 'add', event_id: eventId, name: newPlayerName.trim() })
    if (result.player) {
      setNewPlayerName('')
      await loadPlayers()
      await regenerateFutureRounds()
    } else {
      setError(result.error || 'Failed to add player')
    }
    setActionLoading(null)
  }

  const handleRemovePlayer = async (playerId: string) => {
    if (!eventId) return
    setActionLoading('remove')
    setError(null)
    const result = await callMatchplayPlayer({ action: 'remove', player_id: playerId })
    if (result.success) {
      await loadPlayers()
      await regenerateFutureRounds()
    } else {
      setError(result.error || 'Failed to remove player')
    }
    setActionLoading(null)
  }

  const regenerateFutureRounds = async () => {
    if (!eventId || !event) return
    const currentRound = rounds.find((r) => r.status !== 'completed')
    const currentRoundNum = event.status === 'setup' ? 0 : (currentRound?.round_number ?? 0)
    const futureRounds = rounds.filter((r) => (r.round_number ?? 0) > currentRoundNum)

    for (const r of futureRounds) {
      const hasCompleted = (r.matches ?? []).some((m) => m.status === 'completed')
      if (hasCompleted) continue
      await callMatchplayRound({ action: 'delete_round', round_id: r.id })
    }
    if (event.status === 'setup') {
      for (const r of rounds) {
        const hasCompleted = (r.matches ?? []).some((m) => m.status === 'completed')
        if (!hasCompleted) await callMatchplayRound({ action: 'delete_round', round_id: r.id })
      }
    }

    const listResult = await callMatchplayRound({ action: 'list_rounds', event_id: eventId })
    const remaining = (listResult.rounds ?? []) as { round_number?: number }[]
    const existingNumbers = new Set(remaining.map((r) => r.round_number ?? 0))

    const courtLabels = getCourtLabels()
    const playerIds = players.map((p) => p.id)
    if (playerIds.length < 4) {
      await loadRounds()
      return
    }
    const pairings = generateAmericanoPairings(playerIds, courtLabels)

    for (const p of pairings) {
      if (existingNumbers.has(p.roundNumber)) continue
      const shouldCreate = event.status === 'setup' || p.roundNumber > currentRoundNum
      if (!shouldCreate) continue

      const result = await callMatchplayRound({
        action: 'create_round',
        event_id: eventId,
        round_number: p.roundNumber,
        matches: p.matches,
      })
      if (result.round) existingNumbers.add(p.roundNumber)
      else if (result.error?.includes('duplicate') || result.error?.includes('unique')) {
        existingNumbers.add(p.roundNumber)
      }
    }
    await loadRounds()
  }

  const handleEditMatchSave = async () => {
    const m = showEditMatchModal
    if (!m || !eventId) return
    const { a1, a2, b1, b2 } = editMatchAssignments
    if (!a1 || !a2 || !b1 || !b2) return
    setActionLoading('edit')
    setError(null)
    const result = await callMatchplayRound({
      action: 'update_match',
      match_id: m.id,
      team_a: [a1, a2],
      team_b: [b1, b2],
    })
    if (result.success) {
      setShowEditMatchModal(null)
      setEditMatchAssignments({ a1: '', a2: '', b1: '', b2: '' })
      loadRounds()
    } else {
      setError(result.error || 'Failed to update match')
    }
    setActionLoading(null)
  }

  const openEditMatch = (match: MatchplayMatch) => {
    setEditMatchAssignments({
      a1: match.team_a_player_1_id,
      a2: match.team_a_player_2_id,
      b1: match.team_b_player_1_id,
      b2: match.team_b_player_2_id,
    })
    setShowEditMatchModal(match)
  }

  const groupStandings = (list: MatchplayPlayer[]) => {
    const groups: { rank: number; players: MatchplayPlayer[] }[] = []
    let rank = 1
    let i = 0
    while (i < list.length) {
      const p = list[i]!
      const groupPlayers = [p]
      while (i + 1 < list.length) {
        const next = list[i + 1]!
        if (next.total_points === p.total_points && next.game_difference === p.game_difference) {
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

  const isSetup = event?.status === 'setup'
  const isLive = event?.status === 'in_progress'

  if (loading && !event) {
    return (
      <div className="matchplay-event-page">
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="matchplay-event-page">
        <p style={{ color: 'var(--error)' }}>{error}</p>
        <Link href="/matchplay" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to list
        </Link>
      </div>
    )
  }

  if (!event) return null

  return (
    <div className="matchplay-event-page">
      <header className="matchplay-event-header">
        <button
          type="button"
          className="matchplay-event-back"
          onClick={() => router.push('/matchplay')}
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="matchplay-event-title">{event.name}</h1>
        <div className="matchplay-event-header-actions">
          <button
            type="button"
            className="matchplay-event-icon-btn"
            onClick={() => setShowPlayersModal(true)}
            aria-label="Players"
          >
            👥
          </button>
          {isLive && (
            <button
              type="button"
              className="matchplay-event-icon-btn"
              onClick={() => {
                loadStandings()
                setShowStandingsModal(true)
              }}
              aria-label="Standings"
            >
              📊
            </button>
          )}
          <div className="matchplay-event-header-right">
            {isLive && (
              <div className="matchplay-event-menu-wrap">
                <button
                  type="button"
                  className="matchplay-event-menu-btn"
                  onClick={() => setShowEndEventMenu(!showEndEventMenu)}
                  aria-label="More options"
                >
                  ⋮
                </button>
                {showEndEventMenu && (
                  <>
                    <div className="matchplay-event-menu-backdrop" onClick={() => setShowEndEventMenu(false)} />
                    <div className="matchplay-event-menu-dropdown">
                      <button
                        type="button"
                        className="matchplay-event-menu-item"
                        onClick={handleCompleteEvent}
                        disabled={!!actionLoading}
                      >
                        End Event
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <span
              className={`matchplay-event-status-badge ${
                isSetup ? 'matchplay-event-status-setup' : isLive ? 'matchplay-event-status-live' : 'matchplay-event-status-completed'
              }`}
            >
              {isSetup && 'SETUP'}
              {isLive && (
                <>
                  <span className="matchplay-event-status-dot" aria-hidden />
                  LIVE
                </>
              )}
              {event.status === 'completed' && 'COMPLETED'}
            </span>
          </div>
        </div>
      </header>

      {/* Round tabs */}
      <div className="matchplay-event-round-tabs-wrap" ref={roundTabsRef}>
        <div className="matchplay-event-round-tabs">
          {rounds.map((round) => (
            <button
              key={round.id}
              type="button"
              className={`matchplay-event-round-tab ${selectedRoundId === round.id ? 'active' : ''} ${
                round.status === 'completed' ? 'completed' : round.status === 'in_progress' ? 'in-progress' : ''
              }`}
              data-round-id={round.id}
              onClick={() => setSelectedRoundId(round.id)}
            >
              Round {round.round_number}
              {round.status === 'completed' && <span className="matchplay-event-round-check">✓</span>}
              {round.status === 'in_progress' && <span className="matchplay-event-round-dot">·</span>}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="setup-error matchplay-event-error">{error}</div>}

      {/* Match cards */}
      {!viewingRound ? (
        <div className="matchplay-event-empty">No rounds yet. Add players and wait for pairings to generate.</div>
      ) : (
        <div className="matchplay-event-matches">
          {(viewingRound.matches ?? []).map((match) => {
            const teamANames = [match.team_a_player_1_name || '-', match.team_a_player_2_name || '-'].join(' + ')
            const teamBNames = [match.team_b_player_1_name || '-', match.team_b_player_2_name || '-'].join(' + ')
            const isCompleted = match.status === 'completed'
            const isExpanded = expandedMatchId === match.id
            const draft = draftScores[match.id]
            const scoreA = draft?.a ?? (isExpanded ? (match.team_a_score ?? 0) : 0)
            const scoreB = isAmericano ? (maxScore - scoreA) : (draft?.b ?? (isExpanded ? (match.team_b_score ?? 0) : 0))
            const canEdit = !isAmericano && (isSetup || (isLive && !hasCompletedMatchInCurrentRound))

            if (isSetup) {
              return (
                <div key={match.id} className="matchplay-event-match-card matchplay-event-match-card-setup">
                  <div className="matchplay-event-match-header">
                    <span className="matchplay-event-match-court">{match.court_label}</span>
                    {canEdit && (
                      <button
                        type="button"
                        className="matchplay-event-match-edit-btn"
                        onClick={() => openEditMatch(match)}
                      >
                        EDIT
                      </button>
                    )}
                  </div>
                  <div className="matchplay-event-match-teams">
                    {teamANames} vs {teamBNames}
                  </div>
                </div>
              )
            }

            if (isCompleted) {
              return (
                <div key={match.id} className="matchplay-event-match-card matchplay-event-match-card-completed">
                  <span className="matchplay-event-match-court">{match.court_label}</span>
                  <span className="matchplay-event-match-summary">
                    {teamANames} {(match.team_a_score ?? 0)}-{(match.team_b_score ?? 0)} {teamBNames}
                  </span>
                  <span className="matchplay-event-match-done">✓</span>
                </div>
              )
            }

            if (isExpanded) {
              const teamAWins = scoreA > scoreB
              const teamBWins = scoreB > scoreA
              return (
                <div key={match.id} className="matchplay-event-match-card matchplay-event-match-card-expanded">
                  <div className="matchplay-event-match-header">
                    <span className="matchplay-event-match-court">{match.court_label}</span>
                  </div>
                  <div className="matchplay-event-score-entry">
                    <div className="matchplay-event-score-row">
                      <span className="matchplay-event-score-team">{teamANames}</span>
                      <div className="matchplay-event-stepper">
                        <button
                          type="button"
                          className="matchplay-event-stepper-btn"
                          aria-label="Decrease Team A"
                          disabled={scoreA <= 0}
                          onClick={() =>
                            setDraftScores((prev) => ({
                              ...prev,
                              [match.id]: { ...(prev[match.id] ?? { a: 0, b: 0 }), a: Math.max(0, scoreA - 1) },
                            }))
                          }
                        >
                          −
                        </button>
                        <span className="matchplay-event-stepper-value">{scoreA}</span>
                        <button
                          type="button"
                          className="matchplay-event-stepper-btn"
                          aria-label="Increase Team A"
                          disabled={isAmericano && scoreA >= maxScore}
                          onClick={() =>
                            setDraftScores((prev) => ({
                              ...prev,
                              [match.id]: {
                                ...(prev[match.id] ?? { a: 0, b: 0 }),
                                a: isAmericano ? Math.min(maxScore, scoreA + 1) : scoreA + 1,
                              },
                            }))
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="matchplay-event-vs">vs</div>
                    <div className="matchplay-event-score-row">
                      <span className="matchplay-event-score-team">{teamBNames}</span>
                      {isAmericano ? (
                        <span className="matchplay-event-stepper-value">{scoreB}</span>
                      ) : (
                        <div className="matchplay-event-stepper">
                          <button
                            type="button"
                            className="matchplay-event-stepper-btn"
                            aria-label="Decrease Team B"
                            disabled={scoreB <= 0}
                            onClick={() =>
                              setDraftScores((prev) => ({
                                ...prev,
                                [match.id]: { ...(prev[match.id] ?? { a: 0, b: 0 }), b: Math.max(0, scoreB - 1) },
                              }))
                            }
                          >
                            −
                          </button>
                          <span className="matchplay-event-stepper-value">{scoreB}</span>
                          <button
                            type="button"
                            className="matchplay-event-stepper-btn"
                            aria-label="Increase Team B"
                            onClick={() =>
                              setDraftScores((prev) => ({
                                ...prev,
                                [match.id]: { ...(prev[match.id] ?? { a: 0, b: 0 }), b: scoreB + 1 },
                              }))
                            }
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {(scoreA > 0 || scoreB > 0) && (
                    <div className="matchplay-event-result-preview">
                      Result: {teamAWins ? `${teamANames} win` : teamBWins ? `${teamBNames} win` : 'Draw'}
                    </div>
                  )}
                  <div className="matchplay-event-score-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setExpandedMatchId(null)
                        setDraftScores((prev) => {
                          const next = { ...prev }
                          delete next[match.id]
                          return next
                        })
                      }}
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={submittingMatchId === match.id}
                      onClick={() => handleEnterResult(match.id, scoreA, scoreB)}
                    >
                      {submittingMatchId === match.id ? 'Saving...' : 'CONFIRM SCORE'}
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={match.id}
                className="matchplay-event-match-card matchplay-event-match-card-pending"
                onClick={() => setExpandedMatchId(match.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setExpandedMatchId(match.id)}
              >
                <div className="matchplay-event-match-header">
                  <span className="matchplay-event-match-court">{match.court_label}</span>
                  <span className="matchplay-event-match-pending-badge">PENDING</span>
                </div>
                <div className="matchplay-event-match-teams">
                  {teamANames} vs {teamBNames}
                </div>
                <div className="matchplay-event-match-hint">Tap to enter score</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Resting section */}
      {viewingRound && (() => {
        const assignedIds = new Set<string>()
        for (const m of viewingRound.matches ?? []) {
          assignedIds.add(m.team_a_player_1_id)
          assignedIds.add(m.team_a_player_2_id)
          assignedIds.add(m.team_b_player_1_id)
          assignedIds.add(m.team_b_player_2_id)
        }
        const resting = players.filter((p) => !assignedIds.has(p.id))
        const sitOutCounts = getSitOutCounts()
        if (resting.length === 0) return null
        return (
          <div className="matchplay-event-resting">
            <div className="matchplay-event-resting-title">Resting this round</div>
            <div className="matchplay-event-resting-list">
              {resting.map((p) => (
                <span key={p.id} className="matchplay-event-resting-player">
                  {p.name}
                  {(sitOutCounts[p.id] ?? 0) > 0 && (
                    <span className="matchplay-event-resting-count"> (rested {(sitOutCounts[p.id] ?? 0)} times)</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Footer */}
      <footer className="matchplay-event-footer">
        {isSetup && (
          <button
            type="button"
            className="btn btn-primary matchplay-event-footer-btn"
            onClick={handleStartEvent}
            disabled={!!actionLoading || players.length < 4}
          >
            {actionLoading === 'start' ? 'Starting...' : 'START EVENT'}
          </button>
        )}
        {isLive && (
          <>
            {canShowEndEvent && isFinalRound && allMatchesScoredInCurrentRound ? (
              <button
                type="button"
                className="btn btn-primary matchplay-event-footer-btn"
                onClick={handleCompleteEvent}
                disabled={!!actionLoading}
              >
                {actionLoading === 'complete' ? 'Ending...' : 'END EVENT'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary matchplay-event-footer-btn"
                onClick={handleNextRound}
                disabled={!allMatchesScoredInCurrentRound || isFinalRound}
              >
                NEXT ROUND
              </button>
            )}
          </>
        )}
      </footer>

      {/* Players Modal */}
      {showPlayersModal && (
        <div className="matchplay-event-modal-overlay" onClick={() => setShowPlayersModal(false)}>
          <div className="matchplay-event-modal matchplay-event-players-modal" onClick={(e) => e.stopPropagation()}>
            <div className="matchplay-event-modal-header">
              <h2>Players</h2>
              <button type="button" className="matchplay-event-modal-close" onClick={() => setShowPlayersModal(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="matchplay-event-modal-body">
              <div className="matchplay-event-add-player">
                <input
                  type="text"
                  className="input"
                  placeholder="Add player"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                />
                <button type="button" className="btn btn-primary" onClick={handleAddPlayer} disabled={!newPlayerName.trim() || !!actionLoading}>
                  Add
                </button>
              </div>
              <div className="matchplay-event-player-count">{players.length} players</div>
              <div className="matchplay-event-player-list">
                {players.map((p) => (
                  <div key={p.id} className="matchplay-event-player-row">
                    <span>{p.name}</span>
                    <button
                      type="button"
                      className="matchplay-event-player-remove"
                      onClick={() => handleRemovePlayer(p.id)}
                      aria-label={`Remove ${p.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standings Modal */}
      {showStandingsModal && (
        <div className="matchplay-event-modal-overlay" onClick={() => setShowStandingsModal(false)}>
          <div className="matchplay-event-modal matchplay-event-standings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="matchplay-event-modal-header">
              <h2>Standings</h2>
              <button type="button" className="matchplay-event-modal-close" onClick={() => setShowStandingsModal(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="matchplay-event-modal-body">
              <div style={{ overflowX: 'auto' }}>
                <table className="matchplay-standings">
                  <thead>
                    <tr>
                      <th className="rank">#</th>
                      <th className="player">Player</th>
                      {isAmericano ? (
                        <>
                          <th className="num">W</th>
                          <th className="num">T</th>
                          <th className="num">L</th>
                          <th className="num">P</th>
                          <th className="num">+/−</th>
                        </>
                      ) : (
                        <>
                          <th className="num">P</th>
                          <th className="num">W</th>
                          <th className="num">D</th>
                          <th className="num">L</th>
                          <th className="num">GD</th>
                          <th className="num">Pts</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {groupStandings(standings).flatMap((g) =>
                      g.players.map((s, idx) => (
                        <tr key={s.id} className={`${g.rank <= 3 ? `rank-${g.rank}` : ''} ${idx > 0 ? 'matchplay-tie-cont' : ''}`}>
                          <td className="rank">
                            {idx === 0 ? (g.rank <= 3 ? ['🥇', '🥈', '🥉'][g.rank - 1] : g.rank) : <span className="matchplay-tie-connector">└</span>}
                          </td>
                          <td className="player">{s.name}</td>
                          {isAmericano ? (
                            <>
                              <td className="num">{(s.matches_won ?? 0) || '-'}</td>
                              <td className="num">{(s.matches_drawn ?? 0) || '-'}</td>
                              <td className="num">{(s.matches_lost ?? 0) || '-'}</td>
                              <td className="num">{(s.total_points ?? 0) || '-'}</td>
                              <td className="num">{(s.game_difference ?? 0) >= 0 ? `+${s.game_difference}` : s.game_difference}</td>
                            </>
                          ) : (
                            <>
                              <td className="num">{(s.matches_played ?? 0) || '-'}</td>
                              <td className="num">{(s.matches_won ?? 0) || '-'}</td>
                              <td className="num">{(s.matches_drawn ?? 0) || '-'}</td>
                              <td className="num">{(s.matches_lost ?? 0) || '-'}</td>
                              <td className="num">{(s.game_difference ?? 0) || '-'}</td>
                              <td className="num">{(s.total_points ?? 0) || '-'}</td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Match Modal */}
      {showEditMatchModal && viewingRound && (
        <div className="matchplay-event-modal-overlay" onClick={() => setShowEditMatchModal(null)}>
          <div className="matchplay-event-modal matchplay-event-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="matchplay-event-modal-header">
              <h2>Edit {showEditMatchModal.court_label}</h2>
              <button type="button" className="matchplay-event-modal-close" onClick={() => setShowEditMatchModal(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="matchplay-event-modal-body">
              {error && <div className="setup-error" style={{ marginBottom: '1rem' }}>{error}</div>}
              <div className="matchplay-event-edit-teams">
                <div className="matchplay-event-edit-team">
                  <label>Team A</label>
                  <select
                    value={editMatchAssignments.a1}
                    onChange={(e) => setEditMatchAssignments((prev) => ({ ...prev, a1: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {players
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => {
                        const assigned = getAssignedInRound(viewingRound, showEditMatchModal!.id)
                        const inThisMatch = [editMatchAssignments.a1, editMatchAssignments.a2, editMatchAssignments.b1, editMatchAssignments.b2].includes(p.id)
                        return (
                          <option key={p.id} value={p.id} disabled={assigned.has(p.id) && !inThisMatch}>
                            {p.name}
                          </option>
                        )
                      })}
                  </select>
                  <select
                    value={editMatchAssignments.a2}
                    onChange={(e) => setEditMatchAssignments((prev) => ({ ...prev, a2: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {players
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => {
                        const assigned = getAssignedInRound(viewingRound, showEditMatchModal!.id)
                        const inThisMatch = [editMatchAssignments.a1, editMatchAssignments.a2, editMatchAssignments.b1, editMatchAssignments.b2].includes(p.id)
                        return (
                          <option key={p.id} value={p.id} disabled={assigned.has(p.id) && !inThisMatch}>
                            {p.name}
                          </option>
                        )
                      })}
                  </select>
                </div>
                <div className="matchplay-event-edit-team">
                  <label>Team B</label>
                  <select
                    value={editMatchAssignments.b1}
                    onChange={(e) => setEditMatchAssignments((prev) => ({ ...prev, b1: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {players
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => {
                        const assigned = getAssignedInRound(viewingRound, showEditMatchModal!.id)
                        const inThisMatch = [editMatchAssignments.a1, editMatchAssignments.a2, editMatchAssignments.b1, editMatchAssignments.b2].includes(p.id)
                        return (
                          <option key={p.id} value={p.id} disabled={assigned.has(p.id) && !inThisMatch}>
                            {p.name}
                          </option>
                        )
                      })}
                  </select>
                  <select
                    value={editMatchAssignments.b2}
                    onChange={(e) => setEditMatchAssignments((prev) => ({ ...prev, b2: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {players
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => {
                        const assigned = getAssignedInRound(viewingRound, showEditMatchModal!.id)
                        const inThisMatch = [editMatchAssignments.a1, editMatchAssignments.a2, editMatchAssignments.b1, editMatchAssignments.b2].includes(p.id)
                        return (
                          <option key={p.id} value={p.id} disabled={assigned.has(p.id) && !inThisMatch}>
                            {p.name}
                          </option>
                        )
                      })}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-primary" onClick={handleEditMatchSave} disabled={!!actionLoading || !editMatchAssignments.a1 || !editMatchAssignments.a2 || !editMatchAssignments.b1 || !editMatchAssignments.b2}>
                  Save
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditMatchModal(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
