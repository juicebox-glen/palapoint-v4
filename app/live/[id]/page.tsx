'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, getCourtBySlug } from '@/lib/supabase'
import type { MatchState } from '@/lib/types/match'
import { formatPointDisplay } from '@/lib/utils/score-format'

export default function LivePage() {
  const params = useParams()
  const courtIdentifier = params.id as string

  const [loading, setLoading] = useState(true)
  const [match, setMatch] = useState<MatchState | null>(null)
  const [courtId, setCourtId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courtIdentifier) return

    async function resolveCourt() {
      try {
        const court = await getCourtBySlug(courtIdentifier)
        if (!court) {
          setError('Court not found')
          setLoading(false)
          return
        }
        setCourtId(court.id)
      } catch (err) {
        console.error('Error resolving court:', err)
        setError('Failed to load court')
        setLoading(false)
      }
    }

    resolveCourt()
  }, [courtIdentifier])

  useEffect(() => {
    if (!courtId) return

    let channel: ReturnType<typeof supabase.channel> | null = null

    async function loadMatch() {
      try {
        const { data, error: fetchError } = await supabase
          .from('live_matches')
          .select('*')
          .eq('court_id', courtId)
          .in('status', ['setup', 'in_progress'])
          .maybeSingle()

        if (fetchError) {
          console.error('Error loading match:', fetchError)
          setError('Failed to load match')
        } else {
          setMatch(data as MatchState | null)
        }
        setLoading(false)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Unexpected error occurred')
        setLoading(false)
      }
    }

    loadMatch()

    channel = supabase
      .channel(`live-spectator-${courtId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_matches',
          filter: `court_id=eq.${courtId}`,
        },
        (payload) => {
          const eventType =
            payload.eventType ?? (payload as { event?: string }).event
          if (eventType === 'DELETE') {
            setMatch(null)
            return
          }
          const record =
            payload.new ??
            (payload as { data?: { record?: unknown } }).data?.record
          const updatedMatch = record as MatchState | undefined
          if (
            updatedMatch?.status === 'setup' ||
            updatedMatch?.status === 'in_progress'
          ) {
            setMatch(updatedMatch)
          } else {
            setMatch(null)
          }
        }
      )
      .subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [courtId])

  // Poll when no match - catches new games if realtime misses
  useEffect(() => {
    if (!courtId || match) return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('live_matches')
        .select('*')
        .eq('court_id', courtId)
        .in('status', ['setup', 'in_progress'])
        .maybeSingle()
      if (data) setMatch(data as MatchState)
    }, 5000)
    return () => clearInterval(interval)
  }, [courtId, match])

  const getGameModeText = (mode: string): string => {
    switch (mode) {
      case 'golden_point':
        return 'GOLDEN POINT'
      case 'silver_point':
        return 'SILVER POINT'
      case 'traditional':
        return 'TRADITIONAL'
      default:
        return mode.toUpperCase()
    }
  }

  const getSetsWon = (team: 'a' | 'b'): number => {
    if (!match?.set_scores) return 0
    return match.set_scores.filter((set) => {
      const teamA = set.team_a ?? 0
      const teamB = set.team_b ?? 0
      return team === 'a' ? teamA > teamB : teamB > teamA
    }).length
  }

  if (loading) {
    return (
      <div className="spectator-container">
        <p className="spectator-loading">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="spectator-container">
        <p className="spectator-error">{error}</p>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="spectator-container">
        <div className="spectator-header">
          <div className="spectator-logo">
            <img
              src="/images/squareone-logo.png"
              alt="Square One"
              className="spectator-logo-img"
            />
          </div>
          <div className="spectator-header-right">
            <div className="spectator-live-badge">
              <span className="spectator-offline-dot" aria-hidden />
              <span>OFFLINE</span>
            </div>
          </div>
        </div>
        <div className="spectator-no-match">
          <p>No active match</p>
        </div>
      </div>
    )
  }

  const teamASets = getSetsWon('a')
  const teamBSets = getSetsWon('b')
  const pointsA = formatPointDisplay(
    match.team_a_points,
    match.team_b_points,
    match.is_tiebreak ?? false,
    match.is_tiebreak ? match.tiebreak_scores?.team_a : undefined
  )
  const pointsB = formatPointDisplay(
    match.team_b_points,
    match.team_a_points,
    match.is_tiebreak ?? false,
    match.is_tiebreak ? match.tiebreak_scores?.team_b : undefined
  )

  return (
    <div className="spectator-container">
      {/* Header: Logo | (Game mode + LIVE badge) right-aligned */}
      <div className="spectator-header">
        <div className="spectator-logo">
          <img
            src="/images/squareone-logo.png"
            alt="Square One"
            className="spectator-logo-img"
          />
        </div>

        <div className="spectator-header-right">
          <div className="spectator-game-info">
            <span>{getGameModeText(match.game_mode)}</span>
            {match.is_tiebreak && (
              <>
                <span className="spectator-divider">|</span>
                <span>TIEBREAK</span>
              </>
            )}
          </div>

          <div className="spectator-live-badge">
            <span className="spectator-live-dot" aria-hidden />
            <span>LIVE</span>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="spectator-cards">
        {/* Team A Card */}
        <div className="spectator-card spectator-card-team-a">
          <div className="spectator-card-names">
            <span className="spectator-player-name">
              {match.team_a_player_1 || 'Player 1'}
            </span>
            <span className="spectator-player-name">
              {match.team_a_player_2 || 'Player 2'}
            </span>
          </div>

          <div className="spectator-card-scores">
            {match.serving_team === 'a' && (
              <span className="spectator-serving-dot" aria-hidden />
            )}
            <span className="spectator-score spectator-score-sets">
              {teamASets}
            </span>
            <span className="spectator-score spectator-score-games">
              {match.team_a_games}
            </span>
            <span className="spectator-score spectator-score-points">
              {pointsA}
            </span>
          </div>
        </div>

        {/* Team B Card */}
        <div className="spectator-card spectator-card-team-b">
          <div className="spectator-card-names">
            <span className="spectator-player-name">
              {match.team_b_player_1 || 'Player 1'}
            </span>
            <span className="spectator-player-name">
              {match.team_b_player_2 || 'Player 2'}
            </span>
          </div>

          <div className="spectator-card-scores">
            {match.serving_team === 'b' && (
              <span className="spectator-serving-dot" aria-hidden />
            )}
            <span className="spectator-score spectator-score-sets">
              {teamBSets}
            </span>
            <span className="spectator-score spectator-score-games">
              {match.team_b_games}
            </span>
            <span className="spectator-score spectator-score-points">
              {pointsB}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
