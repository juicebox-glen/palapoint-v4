'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, getCourtBySlug } from '@/lib/supabase'
import type { MatchState } from '@/lib/types/match'
import {
  buildTeamName,
  formatGameDuration,
  getHorizontalScoreParts,
} from '@/lib/utils/score-format'
import { getPointSituation } from '@/lib/utils/point-situation'
import '@/app/styles/spectator.css'

export default function LivePage() {
  const params = useParams()
  const courtIdentifier = params.id as string
  const [courtId, setCourtId] = useState<string | null>(null)
  const [match, setMatch] = useState<MatchState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameTime, setGameTime] = useState('0:00')

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
          setLoading(false)
          return
        }

        setMatch(data)
        setLoading(false)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Unexpected error occurred')
        setLoading(false)
      }
    }

    loadMatch()

    channel = supabase
      .channel(`live-${courtId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_matches',
          filter: `court_id=eq.${courtId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setMatch(null)
            return
          }

          const updatedMatch = payload.new as MatchState

          if (
            updatedMatch.status === 'setup' ||
            updatedMatch.status === 'in_progress'
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

  // Update game time every second when match is active
  useEffect(() => {
    if (!match?.started_at) return
    const updateTime = () =>
      setGameTime(formatGameDuration(match.started_at ?? null))
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [match?.started_at])

  if (loading) {
    return (
      <div className="spectator-page">
        <div className="spectator-16-9">
          <div className="spectator-loading">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="spectator-page">
        <div className="spectator-16-9">
          <div className="spectator-error">{error}</div>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="spectator-page">
        <div className="spectator-16-9">
          <div className="spectator-empty">No active match</div>
        </div>
      </div>
    )
  }

  const teamAName = buildTeamName(
    match.team_a_player_1,
    match.team_a_player_2,
    'Team A'
  )
  const teamBName = buildTeamName(
    match.team_b_player_1,
    match.team_b_player_2,
    'Team B'
  )

  const partsA = getHorizontalScoreParts(
    match.set_scores,
    'a',
    match.team_a_games,
    match.team_a_points,
    match.team_b_points,
    match.is_tiebreak ?? false,
    match.is_tiebreak ? match.tiebreak_scores?.team_a : undefined
  )
  const partsB = getHorizontalScoreParts(
    match.set_scores,
    'b',
    match.team_b_games,
    match.team_b_points,
    match.team_a_points,
    match.is_tiebreak ?? false,
    match.is_tiebreak ? match.tiebreak_scores?.team_b : undefined
  )

  const pointSituation = getPointSituation(match)

  return (
    <div className="spectator-page">
      <div className="spectator-16-9">
        <div className="spectator-container">
        {/* Top bar: Logo | Game time + LIVE */}
        <header className="spectator-topbar">
          <div className="spectator-logo">
            <div className="spectator-logo-mark">
              <span className="spectator-logo-l" />
              <span className="spectator-logo-square" />
            </div>
            <h1 className="spectator-brand">
              <span className="spectator-brand-square">SQUARE</span>
              <span className="spectator-brand-one">ONE</span>
            </h1>
          </div>
          <div className="spectator-time-live">
            <span className="spectator-time">{gameTime}</span>
            <span className="spectator-live">
              <span className="spectator-live-dot" aria-hidden />
              LIVE
            </span>
          </div>
        </header>

        {/* Score panel: horizontal layout */}
        <div
          className={`spectator-score-panel ${
            match.serving_team === 'a' ? 'team-a-accent' : 'team-b-accent'
          }`}
        >
          <div className="spectator-player-row">
            <span className="spectator-player-name">{teamAName}</span>
            <div className="spectator-player-scores">
              {match.serving_team === 'a' && (
                <span className="spectator-serving-dot" aria-hidden />
              )}
              {partsA.map((part, i) => {
                const isHighlight = match.serving_team === 'a' && i === (match.set_scores?.length ?? 0)
                return (
                  <span
                    key={i}
                    className={`spectator-score-part ${isHighlight ? 'highlight' : i === 0 ? 'muted' : ''}`}
                  >
                    {part}
                  </span>
                )
              })}
            </div>
          </div>
          <div className="spectator-player-row">
            <span className="spectator-player-name">{teamBName}</span>
            <div className="spectator-player-scores">
              {match.serving_team === 'b' && (
                <span className="spectator-serving-dot" aria-hidden />
              )}
              {partsB.map((part, i) => {
                const isHighlight = match.serving_team === 'b' && i === (match.set_scores?.length ?? 0)
                return (
                  <span
                    key={i}
                    className={`spectator-score-part ${isHighlight ? 'highlight' : i === 0 ? 'muted' : ''}`}
                  >
                    {part}
                  </span>
                )
              })}
            </div>
          </div>

          {match.is_tiebreak && (
            <div className="spectator-tiebreak-badge">Tiebreak</div>
          )}

          {pointSituation && (
            <div className="spectator-point-badge">{pointSituation.type}</div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
