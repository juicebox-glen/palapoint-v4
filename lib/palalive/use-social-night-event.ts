'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { supabase } from '@/lib/supabase'
import { callMatchplayEvent, callMatchplayPlayer, callMatchplayRound } from '@/lib/api/matchplay'
import { formatPlayerName } from '@/lib/utils/name-format'
import {
  phaseFromEventStatus,
  selectCurrentMatchplayRound,
} from '@/lib/palalive/select-current-round'

import type {
  SocialNightEventData,
  SocialNightMatch,
  SocialNightMatchPlayer,
  SocialNightPlayer,
} from './social-types'

/** Poll keeps TV in sync if Realtime is slow or unpublished for matchplay tables. */
const SOCIAL_NIGHT_POLL_MS = 2500

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
  status: string
  matches?: RawMatch[]
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
 * Social Night data + Realtime, normalised for PalaLiveSocialView.
 * Reloads standings/fixtures on postgres_changes and a short poll fallback.
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
  // with every score instead of reading "since this round began."
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

    // Ascending — matches staff hub. Matches loaded for every round so mid-event
    // round switches and completed-score display stay accurate without a second hop.
    const sorted = [...list].sort((a, b) => (a.round_number ?? 0) - (b.round_number ?? 0))
    const withMatches = await Promise.all(
      sorted.map(async (r) => {
        const getResult = await callMatchplayRound({ action: 'get_round', round_id: r.id })
        const round = getResult.round as { matches?: RawMatch[]; status?: string } | undefined
        return {
          ...r,
          status: round?.status ?? r.status ?? 'pending',
          matches: round?.matches ?? [],
        }
      })
    )
    setRounds(withMatches)
  }, [eventId])

  const refreshLive = useCallback(async () => {
    await Promise.all([loadEvent(), loadStandings(), loadRounds()])
  }, [loadEvent, loadStandings, loadRounds])

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }
    lastRoundNumberRef.current = null
    currentRoundBaselineRef.current = null
    pendingBaselineRef.current = null
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Realtime channel overload
    ;(chPlayers as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_players', filter: `event_id=eq.${eventId}` },
      () => {
        void loadStandings()
        void loadRoster()
      }
    )
    chPlayers.subscribe()

    const chMatches = supabase.channel(`palalive-social-matches-${eventId}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Realtime channel overload
    ;(chMatches as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_matches', filter: `event_id=eq.${eventId}` },
      () => {
        void loadRounds()
        void loadStandings()
      }
    )
    chMatches.subscribe()

    const chEvents = supabase.channel(`palalive-social-events-${eventId}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Realtime channel overload
    ;(chEvents as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_events', filter: `id=eq.${eventId}` },
      () => {
        void loadEvent()
        void loadRounds()
      }
    )
    chEvents.subscribe()

    const chRounds = supabase.channel(`palalive-social-rounds-${eventId}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Realtime channel overload
    ;(chRounds as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_rounds', filter: `event_id=eq.${eventId}` },
      () => {
        void loadRounds()
      }
    )
    chRounds.subscribe()

    const poll = setInterval(() => {
      void refreshLive()
    }, SOCIAL_NIGHT_POLL_MS)

    return () => {
      supabase.removeChannel(chPlayers)
      supabase.removeChannel(chMatches)
      supabase.removeChannel(chEvents)
      supabase.removeChannel(chRounds)
      clearInterval(poll)
    }
  }, [eventId, loadEvent, loadStandings, loadRoster, loadRounds, refreshLive])

  if (!eventId || !event) {
    return { data: null, loading, error }
  }

  const phase = phaseFromEventStatus(event.status)
  const currentRound = selectCurrentMatchplayRound(rounds, phase)
  const roundNumber = currentRound?.round_number ?? 1
  const totalRounds = rounds.length || 1

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
    const rankDelta =
      previousRank != null && previousRank !== rank ? previousRank - rank : null
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
