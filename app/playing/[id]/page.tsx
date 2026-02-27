'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, getCourtBySlug, type Court } from '@/lib/supabase'
import { validateSession, endSession } from '@/lib/api/session'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface MatchState {
  id: string
  status: string
  team_a_points: number
  team_b_points: number
  team_a_games: number
  team_b_games: number
  set_scores: Array<{ team_a: number; team_b: number }>
  winner: string | null
  team_a_player_1: string | null
  team_a_player_2: string | null
  team_b_player_1: string | null
  team_b_player_2: string | null
  session_id: string | null
  game_mode: string
  sets_to_win: number
  side_swap_enabled: boolean
  is_tiebreak?: boolean
}

interface SessionState {
  valid: boolean
  reason?: string
  session?: unknown
}

export default function PlayingPage() {
  const params = useParams()
  const router = useRouter()
  const courtIdentifier = params.id as string

  const [loading, setLoading] = useState(true)
  const [court, setCourt] = useState<Court | null>(null)
  const [courtId, setCourtId] = useState<string | null>(null)
  const [match, setMatch] = useState<MatchState | null>(null)
  const [sessionState, setSessionState] = useState<SessionState | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    async function loadData() {
      // Resolve court
      const courtData = await getCourtBySlug(courtIdentifier)
      if (!courtData) {
        setLoading(false)
        return
      }

      setCourt(courtData)
      setCourtId(courtData.id)

      if (process.env.NODE_ENV === 'development') {
        console.log('Playing: courtIdentifier (slug):', courtIdentifier)
        console.log('Playing: courtData.id (UUID):', courtData?.id)
      }

      // Get stored session ID using court slug from URL (consistent with setup/teams)
      const storedSessionId =
        typeof window !== 'undefined'
          ? sessionStorage.getItem(`setup_session_id_${courtIdentifier}`)
          : null
      setSessionId(storedSessionId)

      if (process.env.NODE_ENV === 'development') {
        console.log('Playing: storedSessionId:', storedSessionId)
      }

      if (storedSessionId) {
        const validation = await validateSession(storedSessionId)
        setSessionState(validation)

        if (process.env.NODE_ENV === 'development') {
          console.log('Playing: sessionState:', validation)
        }

        if (!validation.valid) {
          setLoading(false)
          return
        }
      }

      // Get active match for this court
      const { data: matchData } = await supabase
        .from('live_matches')
        .select('*')
        .eq('court_id', courtData.id)
        .in('status', ['setup', 'in_progress', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setMatch(matchData as MatchState | null)
      setLoading(false)
    }

    loadData()
  }, [courtIdentifier])

  // Subscribe to match updates
  useEffect(() => {
    if (!courtId) return

    const ch = supabase.channel(`playing-${courtId}`)
    ;(ch as any).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_matches',
        filter: `court_id=eq.${courtId}`,
      },
      (payload: { eventType: string; new?: MatchState }) => {
        if (payload.eventType === 'DELETE') {
          setMatch(null)
        } else if (payload.new) {
          setMatch(payload.new)
        }
      }
    )
    ch.subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [courtId])

  // Periodically validate session (every 60 seconds)
  useEffect(() => {
    if (!sessionId) return

    const interval = setInterval(async () => {
      const validation = await validateSession(sessionId)
      setSessionState(validation)
    }, 60000)

    return () => clearInterval(interval)
  }, [sessionId])

  // Handlers
  const handlePlayAgain = async () => {
    if (!match || !sessionId || !courtId) return

    const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'create',
        court_id: courtId,
        session_id: sessionId,
        game_mode: match.game_mode,
        sets_to_win: match.sets_to_win,
        side_swap_enabled: match.side_swap_enabled,
        team_a_player_1: match.team_a_player_1,
        team_a_player_2: match.team_a_player_2,
        team_b_player_1: match.team_b_player_1,
        team_b_player_2: match.team_b_player_2,
      }),
    })

    const result = await response.json()
    if (result.success) {
      setMatch(result.match)
    }
  }

  const handleNewGame = () => {
    router.push(`/setup/${courtIdentifier}`)
  }

  const handleEndSession = async () => {
    if (!sessionId || !courtId) return

    const result = await endSession(sessionId)

    if (result.success) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`setup_session_id_${courtIdentifier}`)
      }
      router.push(`/session-review/${sessionId}`)
    }
  }

  const formatTeamName = (
    player1: string | null,
    player2: string | null,
    fallback: string
  ) => {
    const names = [player1, player2].filter(Boolean)
    return names.length > 0 ? names.join(' / ') : fallback
  }

  const formatPoints = (points: number, isTiebreak: boolean) => {
    if (isTiebreak) return points.toString()
    const pointMap = ['0', '15', '30', '40']
    return pointMap[points] ?? points.toString()
  }

  // Loading state
  if (loading) {
    return (
      <div className="playing-container">
        <div className="playing-loading">Loading...</div>
      </div>
    )
  }

  // Court not found
  if (!court) {
    return (
      <div className="playing-container">
        <div className="playing-no-session">
          <h1>Court Not Found</h1>
          <p>Please scan the QR code on the court to get started.</p>
          <button
            className="playing-btn playing-btn-primary"
            onClick={() => router.push(`/setup/${courtIdentifier}`)}
          >
            Set Up Game
          </button>
        </div>
      </div>
    )
  }

  // Session expired/ended
  if (sessionState && !sessionState.valid) {
    return (
      <div className="playing-container">
        <div className="playing-session-ended">
          <h1>Session Ended</h1>
          <p>
            {sessionState.reason === 'expired_inactivity'
              ? 'Your session expired due to inactivity.'
              : 'This session has ended.'}
          </p>
          <button
            className="playing-btn playing-btn-primary"
            onClick={() => router.push(`/setup/${courtIdentifier}`)}
          >
            Start New Session
          </button>
        </div>
      </div>
    )
  }

  // No session - redirect to setup
  if (!sessionId) {
    return (
      <div className="playing-container">
        <div className="playing-no-session">
          <h1>No Active Session</h1>
          <p>Scan the QR code on the court to start a session.</p>
          <button
            className="playing-btn playing-btn-primary"
            onClick={() => router.push(`/setup/${courtIdentifier}`)}
          >
            Set Up Game
          </button>
        </div>
      </div>
    )
  }

  // Game completed - show post-game options
  if (match && (match.status === 'completed' || match.winner)) {
    const winnerName =
      match.winner === 'a'
        ? formatTeamName(match.team_a_player_1, match.team_a_player_2, 'Team A')
        : formatTeamName(match.team_b_player_1, match.team_b_player_2, 'Team B')

    const finalScore =
      match.set_scores && match.set_scores.length > 0
        ? match.set_scores.map((s) => `${s.team_a}-${s.team_b}`).join(', ')
        : `${match.team_a_games}-${match.team_b_games}`

    return (
      <div className="playing-container">
        <div className="playing-game-complete">
          <div className="playing-complete-header">
            <h1>Game Complete</h1>
            <p className="playing-court-name">{court?.name || courtIdentifier}</p>
          </div>

          <div className="playing-result">
            <h2 className="playing-winner">{winnerName}</h2>
            <p className="playing-winner-label">WINS</p>
            <p className="playing-final-score">{finalScore}</p>
          </div>

          <div className="playing-post-actions">
            <button
              className="playing-btn playing-btn-primary"
              onClick={handlePlayAgain}
            >
              Play Again
            </button>
            <button
              className="playing-btn playing-btn-secondary"
              onClick={handleNewGame}
            >
              New Game
            </button>
            <button
              className="playing-btn playing-btn-danger"
              onClick={handleEndSession}
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Game in progress - show holding screen
  return (
    <div className="playing-container">
      <div className="playing-in-progress">
        <div className="playing-header">
          <span className="playing-live-badge">● LIVE</span>
          <span className="playing-court-name">{court?.name || courtIdentifier}</span>
        </div>

        <div className="playing-message">
          <h1>Game in Progress</h1>
          <p>Use the court buttons to score</p>
        </div>

        {match && (
          <div className="playing-mini-score">
            <div className="playing-mini-team">
              <span className="playing-mini-name">
                {formatTeamName(
                  match.team_a_player_1,
                  match.team_a_player_2,
                  'Team A'
                )}
              </span>
              <span className="playing-mini-points">
                {formatPoints(match.team_a_points, match.is_tiebreak ?? false)}
              </span>
            </div>
            <div className="playing-mini-games">
              {match.team_a_games} - {match.team_b_games}
            </div>
            <div className="playing-mini-team">
              <span className="playing-mini-name">
                {formatTeamName(
                  match.team_b_player_1,
                  match.team_b_player_2,
                  'Team B'
                )}
              </span>
              <span className="playing-mini-points">
                {formatPoints(match.team_b_points, match.is_tiebreak ?? false)}
              </span>
            </div>
          </div>
        )}

        <div className="playing-session-actions">
          <button
            className="playing-btn playing-btn-danger-outline"
            onClick={handleEndSession}
          >
            End Session
          </button>
        </div>
      </div>
    </div>
  )
}
