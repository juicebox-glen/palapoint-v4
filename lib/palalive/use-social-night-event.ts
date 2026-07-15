'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { supabase } from '@/lib/supabase'
import { callMatchplayEvent, callMatchplayPlayer, callMatchplayRound } from '@/lib/api/matchplay'
import { formatPlayerName } from '@/lib/utils/name-format'

import type {
  SocialNightEventData,
  SocialNightMatch,
  SocialNightMatchPlayer,
  SocialNightPhase,
  SocialNightPlayer,
} from './social-types'

interface RawEvent {
  id: string
  name: string
  status: string
}

interface RawPlayer {
  id: string
  name: string
  photo_url?: string | null
  total_points: number
}

interface RawMatch {
  id: string
  court_label: string
  status: string
  team_a_player_1_name?: string | null
  team_a_player_2_name?: string | null
  team_b_player_1_name?: string | null
  team_b_player_2_name?: string | null
  team_a_player_1_photo_url?: string | null
  team_a_player_2_photo_url?: string | null
  team_b_player_1_photo_url?: string | null
  team_b_player_2_photo_url?: string | null
  team_a_score: number | null
  team_b_score: number | null
}

interface RawRound {
  id: string
  round_number: number
  matches?: RawMatch[]
}

function phaseFromStatus(status: string | undefined): SocialNightPhase {
  if (status === 'completed') return 'postgame'
  if (status === 'in_progress') return 'ingame'
  return 'pregame'
}

function normalizePlayer(name: string | null | undefined, photoUrl: string | null | undefined): SocialNightMatchPlayer {
  return { name: formatPlayerName(name, 'full'), photoUrl: photoUrl ?? null }
}

function normalizeMatch(m: RawMatch): SocialNightMatch {
  const teamAPlayers = [
    normalizePlayer(m.team_a_player_1_name, m.team_a_player_1_photo_url),
    normalizePlayer(m.team_a_player_2_name, m.team_a_player_2_photo_url),
  ].filter((p) => p.name)
  const teamBPlayers = [
    normalizePlayer(m.team_b_player_1_name, m.team_b_player_1_photo_url),
    normalizePlayer(m.team_b_player_2_name, m.team_b_player_2_photo_url),
  ].filter((p) => p.name)

  return {
    id: m.id,
    courtLabel: m.court_label,
    status: m.status,
    teamA: { players: teamAPlayers, score: m.team_a_score },
    teamB: { players: teamBPlayers, score: m.team_b_score },
  }
}

export interface UseSocialNightEventResult {
  data: SocialNightEventData | null
  loading: boolean
  error: string | null
}

/**
 * Social Night data + Realtime, normalised for PalaLiveSocialView. Reuses the same
 * fetch/subscription pattern as MatchplayBoard (matchplay-event/player/round edge
 * functions, Realtime on matchplay_players/matches/events/rounds) rather than the
 * board's presentation logic.
 */
export function useSocialNightEvent(eventId: string | null): UseSocialNightEventResult {
  const [event, setEvent] = useState<RawEvent | null>(null)
  const [standingsRaw, setStandingsRaw] = useState<(RawPlayer & { rank?: number })[]>([])
  const [rosterRaw, setRosterRaw] = useState<RawPlayer[]>([])
  const [rounds, setRounds] = useState<RawRound[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Rank-delta bookkeeping: baseline is the rank order from the moment the current
  // round started, not the previous Realtime tick — otherwise deltas would flicker
  // with every point scored instead of reading "since this round began."
  const lastRoundNumberRef = useRef<number | null>(null)
  const currentRoundBaselineRef = useRef<Map<string, number> | null>(null)
  const pendingBaselineRef = useRef<Map<string, number> | null>(null)

  const loadEvent = useCallback(async () => {
    if (!eventId) return
    const result = await callMatchplayEvent({ action: 'get', event_id: eventId })
    if (result.event) {
      setEvent(result.event as RawEvent)
      setError(null)
    } else if (result.error === 'event_not_found') {
      setEvent(null)
      setError('Event not found')
    }
    // Any other failure is treated as transient — keep showing the last known-good
    // event instead of flickering to a placeholder on a routine network hiccup.
  }, [eventId])

  const loadStandings = useCallback(async () => {
    if (!eventId) return
    const result = await callMatchplayPlayer({ action: 'standings', event_id: eventId })
    setStandingsRaw((result.standings as (RawPlayer & { rank?: number })[] | undefined) ?? [])
  }, [eventId])

  const loadRoster = useCallback(async () => {
    if (!eventId) return
    const result = await callMatchplayPlayer({ action: 'list', event_id: eventId })
    setRosterRaw((result.players as RawPlayer[] | undefined) ?? [])
  }, [eventId])

  const loadRounds = useCallback(async () => {
    if (!eventId) return
    const listResult = await callMatchplayRound({ action: 'list_rounds', event_id: eventId })
    const list = (listResult.rounds as RawRound[] | undefined) ?? []
    if (list.length === 0) {
      setRounds([])
      return
    }
    const sorted = [...list].sort((a, b) => (b.round_number ?? 0) - (a.round_number ?? 0))
    const withMatches = await Promise.all(
      sorted.map(async (r) => {
        const getResult = await callMatchplayRound({ action: 'get_round', round_id: r.id })
        const round = getResult.round as { matches?: RawMatch[] } | undefined
        return { ...r, matches: round?.matches ?? [] }
      })
    )
    setRounds(withMatches)
  }, [eventId])

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }
    lastRoundNumberRef.current = null
    currentRoundBaselineRef.current = null
    pendingBaselineRef.current = null
    // Clear previous event's data so a screen switched to a different event never
    // briefly renders stale cross-event fixtures/standings while the new fetch is in flight.
    setEvent(null)
    setStandingsRaw([])
    setRosterRaw([])
    setRounds([])

    let cancelled = false
    async function loadAll() {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([loadEvent(), loadStandings(), loadRoster(), loadRounds()])
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load event data'
          setError(
            message.includes('fetch')
              ? 'Network error. Check your connection and that Supabase Edge Functions are reachable.'
              : message
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadAll()
    return () => {
      cancelled = true
    }
  }, [eventId, loadEvent, loadStandings, loadRoster, loadRounds])

  useEffect(() => {
    if (!eventId) return

    const chPlayers = supabase.channel(`palalive-social-players-${eventId}`)
    ;(chPlayers as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_players', filter: `event_id=eq.${eventId}` },
      () => {
        loadStandings()
        loadRoster()
      }
    )
    chPlayers.subscribe()

    const chMatches = supabase.channel(`palalive-social-matches-${eventId}`)
    ;(chMatches as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_matches', filter: `event_id=eq.${eventId}` },
      () => {
        loadRounds()
        loadStandings()
      }
    )
    chMatches.subscribe()

    const chEvents = supabase.channel(`palalive-social-events-${eventId}`)
    ;(chEvents as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_events', filter: `id=eq.${eventId}` },
      () => {
        loadEvent()
        loadRounds()
      }
    )
    chEvents.subscribe()

    const chRounds = supabase.channel(`palalive-social-rounds-${eventId}`)
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
  }, [eventId, loadEvent, loadStandings, loadRoster, loadRounds])

  if (!eventId || !event) {
    return { data: null, loading, error }
  }

  const phase = phaseFromStatus(event.status)
  const sortedRounds = rounds // already sorted desc by loadRounds
  // Pregame always shows round 1's fixtures, even though rounds are pre-created up
  // front and sortedRounds[0] is the event's highest round number, not the next one to play.
  const currentRound =
    phase === 'pregame'
      ? (sortedRounds.find((r) => r.round_number === 1) ?? sortedRounds[sortedRounds.length - 1] ?? null)
      : (sortedRounds[0] ?? null)
  const roundNumber = currentRound?.round_number ?? 1
  const totalRounds = sortedRounds.length || 1

  // Snapshot rank order at the start of a new round; diff against the previous round's baseline.
  // Prefer the backend's tie-aware rank (shared rank for players level on points/game-difference)
  // over array position, so tied players don't get a fake distinct rank or a phantom delta.
  const rankNow = new Map(standingsRaw.map((p, i) => [p.id, p.rank ?? i + 1]))
  if (lastRoundNumberRef.current !== roundNumber) {
    currentRoundBaselineRef.current = pendingBaselineRef.current
    lastRoundNumberRef.current = roundNumber
  }
  pendingBaselineRef.current = rankNow

  const baseline = currentRoundBaselineRef.current

  const standings: SocialNightPlayer[] = standingsRaw.map((p, i) => {
    const rank = p.rank ?? i + 1
    const previousRank = baseline?.get(p.id)
    const rankDelta = previousRank != null && previousRank !== rank ? previousRank - rank : null
    return {
      id: p.id,
      name: formatPlayerName(p.name, 'full'),
      photoUrl: p.photo_url ?? null,
      totalPoints: p.total_points,
      rank,
      rankDelta,
    }
  })

  const roster: SocialNightPlayer[] = rosterRaw.map((p) => ({
    id: p.id,
    name: formatPlayerName(p.name, 'full'),
    photoUrl: p.photo_url ?? null,
    totalPoints: p.total_points,
    rank: 0,
    rankDelta: null,
  }))

  const matches: SocialNightMatch[] = (currentRound?.matches ?? []).map(normalizeMatch)

  const data: SocialNightEventData = {
    phase,
    eventName: event.name,
    roundNumber,
    totalRounds,
    matches,
    roster,
    standings,
  }

  return { data, loading, error }
}
