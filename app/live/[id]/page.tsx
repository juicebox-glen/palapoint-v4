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
          .in('status', ['in_progress', 'completed', 'abandoned'])
          .order('created_at', { ascending: false })
          .limit(1)
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
            // Don't clear on delete - keep final score visible until new match starts
            return
          }
          const record =
            payload.new ??
            (payload as { data?: { record?: unknown } }).data?.record
          const updatedMatch = record as MatchState | undefined
          if (updatedMatch) {
            setMatch(updatedMatch)
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
        .in('status', ['in_progress', 'completed', 'abandoned'])
        .order('created_at', { ascending: false })
        .limit(1)
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

  // Build score columns dynamically based on set history
  // set_scores contains only COMPLETED sets. For completed matches, only show set scores (no points column).
  const getScoreColumns = (m: MatchState) => {
    const columns: { teamA: string | number; teamB: string | number; isPoints?: boolean; isPastSet?: boolean; isFinalSet?: boolean }[] = []
    const isMatchComplete = m.status === 'completed' || m.status === 'abandoned' || m.winner

    // Add completed set scores from set_scores array
    if (m.set_scores && Array.isArray(m.set_scores)) {
      m.set_scores.forEach((set: { team_a?: number; team_b?: number; team_a_games?: number; team_b_games?: number }, idx: number) => {
        const teamAGames = set.team_a_games ?? set.team_a ?? 0
        const teamBGames = set.team_b_games ?? set.team_b ?? 0
        const isLastSet = idx === m.set_scores!.length - 1
        columns.push({ teamA: teamAGames, teamB: teamBGames, isPastSet: true, isFinalSet: isMatchComplete && isLastSet })
      })
    }

    // For completed matches with no set_scores, show final games as the only set
    if (isMatchComplete && columns.length === 0) {
      columns.push({
        teamA: m.team_a_games ?? 0,
        teamB: m.team_b_games ?? 0,
        isPastSet: true,
        isFinalSet: true,
      })
    }

    // Only show current games and points if match is still in progress
    if (!isMatchComplete) {
      columns.push({
        teamA: m.team_a_games ?? 0,
        teamB: m.team_b_games ?? 0,
        isPastSet: false,
      })

      const pointsA = formatPointDisplay(
        m.team_a_points ?? 0,
        m.team_b_points ?? 0,
        m.is_tiebreak ?? false,
        m.is_tiebreak ? m.tiebreak_scores?.team_a : undefined
      )
      const pointsB = formatPointDisplay(
        m.team_b_points ?? 0,
        m.team_a_points ?? 0,
        m.is_tiebreak ?? false,
        m.is_tiebreak ? m.tiebreak_scores?.team_b : undefined
      )
      columns.push({ teamA: pointsA, teamB: pointsB, isPoints: true })
    }

    return columns
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

  const isMatchComplete = match.status === 'completed' || match.status === 'abandoned' || match.winner

  return (
    <div className="spectator-container">
      {/* Header: Logo | (Game mode + LIVE/FINAL badge) right-aligned */}
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
            {match.is_tiebreak && !isMatchComplete && (
              <>
                <span className="spectator-divider">|</span>
                <span>TIEBREAK</span>
              </>
            )}
          </div>

          <div className={`spectator-live-badge ${isMatchComplete ? 'spectator-final-badge' : ''}`}>
            <span className={isMatchComplete ? 'spectator-final-dot' : 'spectator-live-dot'} aria-hidden />
            <span>{isMatchComplete ? 'FINAL' : 'LIVE'}</span>
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
            {!isMatchComplete && match.serving_team === 'a' && (
              <span className="spectator-serving-dot" aria-hidden />
            )}
            {getScoreColumns(match).map((col, i) => (
              <span
                key={i}
                className={`spectator-score ${col.isPoints ? 'spectator-score-points' : col.isPastSet ? 'spectator-score-past-set' : 'spectator-score-games'} ${col.isFinalSet && match.winner === 'a' ? 'spectator-score-winner' : ''}`}
              >
                {col.teamA}
              </span>
            ))}
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
            {!isMatchComplete && match.serving_team === 'b' && (
              <span className="spectator-serving-dot" aria-hidden />
            )}
            {getScoreColumns(match).map((col, i) => (
              <span
                key={i}
                className={`spectator-score ${col.isPoints ? 'spectator-score-points' : col.isPastSet ? 'spectator-score-past-set' : 'spectator-score-games'} ${col.isFinalSet && match.winner === 'b' ? 'spectator-score-winner' : ''}`}
              >
                {col.teamB}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
