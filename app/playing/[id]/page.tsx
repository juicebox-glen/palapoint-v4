'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, getCourtBySlug, type Court } from '@/lib/supabase'
import { validateSession, endSession } from '@/lib/api/session'
import Header from '@/components/ui/Header'
import '@/app/styles/setup-form.css'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface MatchState {
  id: string
  status: string
  team_a_points: number
  team_b_points: number
  team_a_games: number
  team_b_games: number
  set_scores: Array<{ team_a?: number; team_b?: number; team_a_games?: number; team_b_games?: number }>
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

interface TeamMatchupCardProps {
  teamAPlayer1?: string | null
  teamAPlayer2?: string | null
  teamBPlayer1?: string | null
  teamBPlayer2?: string | null
  subtitle: string
  title?: string
}

const TeamMatchupCard = ({
  teamAPlayer1,
  teamAPlayer2,
  teamBPlayer1,
  teamBPlayer2,
  subtitle,
  title = 'Match Ready',
}: TeamMatchupCardProps) => {
  const abbreviate = (name: string | null | undefined): string => {
    if (!name) return '---'
    const parts = name.trim().split(' ')
    const lastName = parts[parts.length - 1]
    return lastName.substring(0, 3).toUpperCase()
  }

  const hasTeamANames = !!(teamAPlayer1?.trim() || teamAPlayer2?.trim())
  const hasTeamBNames = !!(teamBPlayer1?.trim() || teamBPlayer2?.trim())

  return (
    <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}
      >
        {title}
      </h2>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          position: 'relative',
          minHeight: '5rem',
        }}
      >
        {/* Team A */}
        <div
          style={{
            flex: 1,
            padding: '0.75rem',
            borderLeft: '3px solid var(--team-a)',
            textAlign: 'center',
          }}
        >
          {hasTeamANames ? (
            <>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                }}
              >
                {abbreviate(teamAPlayer1)}
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                }}
              >
                {abbreviate(teamAPlayer2)}
              </div>
            </>
          ) : (
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.4,
              }}
            >
              Team A
            </div>
          )}
        </div>

        {/* VS */}
        <div
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            padding: '0 0.5rem',
          }}
        >
          VS
        </div>

        {/* Team B */}
        <div
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRight: '3px solid var(--team-b)',
            textAlign: 'center',
          }}
        >
          {hasTeamBNames ? (
            <>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                }}
              >
                {abbreviate(teamBPlayer1)}
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                }}
              >
                {abbreviate(teamBPlayer2)}
              </div>
            </>
          ) : (
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.4,
              }}
            >
              Team B
            </div>
          )}
        </div>
      </div>

      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          marginTop: '1rem',
        }}
      >
        {subtitle}
      </p>
    </div>
  )
}

export default function PlayingPage() {
  const params = useParams()
  const router = useRouter()
  const courtIdentifier = params.id as string

  const [loading, setLoading] = useState(true)
  const [court, setCourt] = useState<Court | null>(null)
  const [courtUuid, setCourtUuid] = useState<string | null>(null)
  const [match, setMatch] = useState<MatchState | null>(null)
  const [sessionState, setSessionState] = useState<SessionState | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const courtName = court?.name || courtIdentifier

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const courtData = await getCourtBySlug(courtIdentifier)
      if (!courtData) {
        setLoading(false)
        return
      }

      setCourt(courtData)
      setCourtUuid(courtData.id)

      if (process.env.NODE_ENV === 'development') {
        console.log('Playing: courtIdentifier (slug):', courtIdentifier)
        console.log('Playing: courtData.id (UUID):', courtData?.id)
      }

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

      const { data: matchData } = await supabase
        .from('live_matches')
        .select('*')
        .eq('court_id', courtData.id)
        .in('status', ['setup', 'in_progress', 'completed', 'abandoned'])
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
    if (!courtUuid) return

    const ch = supabase.channel(`playing-${courtUuid}`)
    ;(ch as any).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_matches',
        filter: `court_id=eq.${courtUuid}`,
      },
      (payload: { eventType: string; new?: MatchState }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Subscription payload:', payload.eventType, payload.new)
        }
        if (payload.eventType === 'DELETE') {
          setMatch(null)
        } else if (payload.new) {
          const newMatch = payload.new as MatchState
          if (process.env.NODE_ENV === 'development') {
            console.log('New match status:', newMatch.status)
          }
          setMatch(newMatch)
        }
      }
    )
    ch.subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [courtUuid])

  // Periodically validate session (every 60 seconds)
  useEffect(() => {
    if (!sessionId) return

    const interval = setInterval(async () => {
      const validation = await validateSession(sessionId)
      setSessionState(validation)
    }, 60000)

    return () => clearInterval(interval)
  }, [sessionId])

  const handlePlayAgain = async () => {
    if (!match || !sessionId || !courtUuid) return

    const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'create',
        court_id: courtUuid,
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

  const handleEndGame = async () => {
    if (!match || !courtUuid) return

    if (process.env.NODE_ENV === 'development') {
      console.log('Ending game for court:', courtUuid)
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'end',
          court_id: courtUuid,
          reason: 'abandoned',
        }),
      })

      const result = await response.json()
      if (process.env.NODE_ENV === 'development') {
        console.log('End game result:', result)
      }
      if (!result.success) {
        console.error('Failed to end game:', result.error)
      }
    } catch (err) {
      console.error('Error ending game:', err)
    }
  }

  const handleNewGame = () => {
    if (match && courtUuid && typeof window !== 'undefined') {
      sessionStorage.setItem(`setup_game_mode_${courtUuid}`, match.game_mode)
      sessionStorage.setItem(`setup_sets_${courtUuid}`, String(match.sets_to_win))
      sessionStorage.setItem(
        `setup_side_swap_${courtUuid}`,
        String(match.side_swap_enabled ?? true)
      )
      const players = [
        match.team_a_player_1 || '',
        match.team_a_player_2 || '',
        match.team_b_player_1 || '',
        match.team_b_player_2 || '',
      ]
      sessionStorage.setItem(`setup_players_${courtUuid}`, JSON.stringify(players))
    }
    router.push(`/setup/${courtIdentifier}`)
  }

  const handleEndSession = async () => {
    if (!sessionId) return

    try {
      const result = await endSession(sessionId)
      if (result.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(`setup_session_id_${courtIdentifier}`)
        }
        router.push(`/session-review/${sessionId}`)
      } else {
        console.error('Failed to end session:', result.error)
      }
    } catch (error) {
      console.error('Error ending session:', error)
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

  // 1. LOADING STATE
  if (loading) {
    return (
      <div className="page page-padded">
        <div className="page-loading">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Court not found
  if (!court) {
    return (
      <div className="page page-padded">
        <Header courtName={courtIdentifier} />
        <div
          className="stack stack-xl"
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Court Not Found</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Please scan the QR code on the court to get started.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => router.push(`/setup/${courtIdentifier}`)}
          >
            Set Up Game
          </button>
        </div>
      </div>
    )
  }

  // 2. SESSION ENDED STATE
  if (sessionState && !sessionState.valid) {
    return (
      <div className="page page-padded">
        <Header courtName={courtName} />
        <div
          className="stack stack-xl"
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Session Ended</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {sessionState.reason === 'expired_inactivity'
              ? 'Your session expired due to inactivity.'
              : 'This session has ended.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => router.push(`/setup/${courtIdentifier}`)}
          >
            Start New Session
          </button>
        </div>
      </div>
    )
  }

  // 3. NO SESSION STATE
  if (!sessionId) {
    return (
      <div className="page page-padded">
        <Header courtName={courtName} />
        <div
          className="stack stack-xl"
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            No Active Session
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Scan the QR code on the court to start a session.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => router.push(`/setup/${courtIdentifier}`)}
          >
            Set Up Game
          </button>
        </div>
      </div>
    )
  }

  // Detect if match is in "ready" state (just created, no score yet)
  const isMatchReady =
    match &&
    match.status === 'in_progress' &&
    match.team_a_points === 0 &&
    match.team_b_points === 0 &&
    match.team_a_games === 0 &&
    match.team_b_games === 0

  // 4. MATCH READY STATE
  if (isMatchReady && match) {
    return (
      <div className="page page-padded">
        <Header
          status="ready"
          statusText="READY"
          courtName={courtName}
        />
        <div
          className="stack"
          style={{ flex: 1, justifyContent: 'flex-start', paddingTop: '1rem' }}
        >
          <TeamMatchupCard
            teamAPlayer1={match.team_a_player_1}
            teamAPlayer2={match.team_a_player_2}
            teamBPlayer1={match.team_b_player_1}
            teamBPlayer2={match.team_b_player_2}
            title="Match Ready"
            subtitle="Press a button on court to begin"
          />
        </div>
        <button className="btn btn-danger btn-block" onClick={handleEndGame}>
          End Game
        </button>
      </div>
    )
  }

  // 5. GAME FINISHED STATE
  const showPostGame =
    match &&
    (match.status === 'completed' ||
      match.status === 'abandoned' ||
      !!match.winner)

  if (process.env.NODE_ENV === 'development') {
    console.log(
      'Render - match:',
      match?.id,
      'status:',
      match?.status,
      'winner:',
      match?.winner
    )
  }

  if (showPostGame && match) {
    const isAbandoned = match.status === 'abandoned'
    const hasWinner = match.winner && !isAbandoned

    const winnerName = hasWinner
      ? match.winner === 'a'
        ? formatTeamName(
            match.team_a_player_1,
            match.team_a_player_2,
            'Team A'
          )
        : formatTeamName(
            match.team_b_player_1,
            match.team_b_player_2,
            'Team B'
          )
      : null

    const finalScore =
      match.set_scores && match.set_scores.length > 0
        ? match.set_scores
            .map(
              (s: { team_a?: number; team_b?: number; team_a_games?: number; team_b_games?: number }) =>
                `${s.team_a_games ?? s.team_a ?? 0}-${s.team_b_games ?? s.team_b ?? 0}`
            )
            .join(', ')
        : `${match.team_a_games}-${match.team_b_games}`

    const winnerTeam = match.winner === 'a' ? 'team-a' : 'team-b'

    return (
      <div className="page page-padded">
        <Header
          status="finished"
          statusText={isAbandoned ? 'GAME ENDED' : 'GAME FINISHED'}
          courtName={courtName}
        />
        <div className="stack" style={{ flex: 1 }}>
          <div
            className={`card card-result ${hasWinner ? `${winnerTeam}-winner` : ''}`}
          >
            {hasWinner && winnerName && (
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.5rem',
                }}
              >
                {winnerName} WIN
              </p>
            )}
            <p
              style={{
                fontSize: '3rem',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {finalScore.replace(', ', ' - ')}
            </p>
            {isAbandoned && (
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  marginTop: '0.5rem',
                }}
              >
                Match was ended early
              </p>
            )}
          </div>
        </div>
        <div className="stack">
          <button
            className="btn btn-primary btn-block"
            onClick={handlePlayAgain}
          >
            Rematch
          </button>
          <button
            className="btn btn-secondary btn-block"
            onClick={handleNewGame}
          >
            Edit Match
          </button>
          <div className="divider"></div>
          <button
            className="btn btn-danger btn-block"
            onClick={handleEndSession}
          >
            End Session
          </button>
        </div>
      </div>
    )
  }

  // 6. GAME IN PROGRESS STATE
  return (
    <div className="page page-padded">
      <Header status="live" statusText="LIVE" courtName={courtName} />
      <div
        className="stack"
        style={{ flex: 1, justifyContent: 'flex-start', paddingTop: '1rem' }}
      >
        <TeamMatchupCard
          teamAPlayer1={match?.team_a_player_1}
          teamAPlayer2={match?.team_a_player_2}
          teamBPlayer1={match?.team_b_player_1}
          teamBPlayer2={match?.team_b_player_2}
          title="Game in Progress"
          subtitle="Use the court buttons to score"
        />
      </div>
      <button className="btn btn-danger btn-block" onClick={handleEndGame}>
        End Game
      </button>
    </div>
  )
}
