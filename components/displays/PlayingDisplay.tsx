'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { validateSession, endSession } from '@/lib/api/session'
import Header from '@/components/ui/Header'
import type { VenueBranding } from '@/lib/venue'
import '@/app/styles/setup-form.css'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

interface MatchState {
  id: string
  status: string
  team_a_points: number
  team_b_points: number
  team_a_games: number
  team_b_games: number
  set_scores: Array<{
    team_a?: number
    team_b?: number
    team_a_games?: number
    team_b_games?: number
  }>
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

function TeamMatchupCard({
  teamAPlayer1,
  teamAPlayer2,
  teamBPlayer1,
  teamBPlayer2,
  subtitle,
  title = 'Match Ready',
}: TeamMatchupCardProps) {
  const abbreviate = (name: string | null | undefined): string => {
    if (!name) return '---'
    const parts = name.trim().split(' ')
    const lastName = parts[parts.length - 1]
    return lastName.substring(0, 3).toUpperCase()
  }
  const hasTeamANames = !!(teamAPlayer1?.trim() || teamAPlayer2?.trim())
  const hasTeamBNames = !!(teamBPlayer1?.trim() || teamBPlayer2?.trim())

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem',
      }}
    >
      <h2
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          textAlign: 'center',
          marginBottom: '1rem',
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          minHeight: '5rem',
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '1rem',
            borderLeft: '3px solid var(--team-a)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
          }}
        >
          {hasTeamANames ? (
            <>
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {abbreviate(teamAPlayer1)}
              </span>
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {abbreviate(teamAPlayer2)}
              </span>
            </>
          ) : (
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Team A
            </span>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          VS
        </div>
        <div
          style={{
            flex: 1,
            padding: '1rem',
            borderRight: '3px solid var(--team-b)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
          }}
        >
          {hasTeamBNames ? (
            <>
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {abbreviate(teamBPlayer1)}
              </span>
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {abbreviate(teamBPlayer2)}
              </span>
            </>
          ) : (
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Team B
            </span>
          )}
        </div>
      </div>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          textAlign: 'center',
          marginTop: '1rem',
        }}
      >
        {subtitle}
      </p>
    </div>
  )
}

interface PlayingDisplayProps {
  courtId: string
  courtSlug: string
  courtName: string
  branding?: VenueBranding | null
}

export default function PlayingDisplay({
  courtId,
  courtSlug,
  courtName,
  branding,
}: PlayingDisplayProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [match, setMatch] = useState<MatchState | null>(null)
  const [sessionState, setSessionState] = useState<SessionState | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const storedSessionId =
        typeof window !== 'undefined'
          ? sessionStorage.getItem(`setup_session_id_${courtSlug}`)
          : null
      setSessionId(storedSessionId)

      if (storedSessionId) {
        const validation = await validateSession(storedSessionId)
        setSessionState(validation)
        if (!validation.valid) {
          setLoading(false)
          return
        }
      }

      const { data: matchData } = await supabase
        .from('live_matches')
        .select('*')
        .eq('court_id', courtId)
        .in('status', ['setup', 'in_progress', 'completed', 'abandoned'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setMatch(matchData as MatchState | null)
      setLoading(false)
    }

    loadData()
  }, [courtId, courtSlug])

  useEffect(() => {
    if (!courtId) return
    const ch = supabase.channel(`playing-${courtId}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase RealtimeChannel
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
          setMatch(payload.new as MatchState)
        }
      }
    )
    ch.subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [courtId])

  useEffect(() => {
    if (!sessionId) return
    const interval = setInterval(async () => {
      const validation = await validateSession(sessionId)
      setSessionState(validation)
    }, 60000)
    return () => clearInterval(interval)
  }, [sessionId])

  const handlePlayAgain = async () => {
    if (!match || !sessionId || !courtId) return
    const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    if (result.success) setMatch(result.match)
  }

  const handleEndGame = async () => {
    if (!match || !courtId) return
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          court_id: courtId,
          reason: 'abandoned',
        }),
      })
    } catch (err) {
      console.error('Error ending game:', err)
    }
  }

  const handleNewGame = () => {
    if (match && courtId && typeof window !== 'undefined') {
      sessionStorage.setItem(`setup_game_mode_${courtId}`, match.game_mode)
      sessionStorage.setItem(`setup_sets_${courtId}`, String(match.sets_to_win))
      sessionStorage.setItem(
        `setup_side_swap_${courtId}`,
        String(match.side_swap_enabled ?? true)
      )
      const players = [
        match.team_a_player_1 || '',
        match.team_a_player_2 || '',
        match.team_b_player_1 || '',
        match.team_b_player_2 || '',
      ]
      sessionStorage.setItem(`setup_players_${courtId}`, JSON.stringify(players))
    }
    router.push(`/setup/${courtSlug}`)
  }

  const handleEndSession = async () => {
    if (!sessionId) return
    try {
      const result = await endSession(sessionId)
      if (result.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(`setup_session_id_${courtSlug}`)
        }
        router.push(`/session-review/${sessionId}`)
      }
    } catch (err) {
      console.error('Failed to end session:', err)
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

  if (loading) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <Header branding={branding} />
        <div className="page-loading" style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (sessionState && !sessionState.valid) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <Header branding={branding} />
        <div
          className="stack stack-xl"
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Session Ended</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {sessionState.reason === 'expired_inactivity'
              ? 'Your session expired due to inactivity.'
              : 'This session has ended.'}
          </p>
          <button className="btn btn-primary" onClick={() => router.push(`/setup/${courtSlug}`)}>
            Start New Session
          </button>
        </div>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <Header branding={branding} />
        <div
          className="stack stack-xl"
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>No Active Session</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Scan the QR code on the court to start a session.
          </p>
          <button className="btn btn-primary" onClick={() => router.push(`/setup/${courtSlug}`)}>
            Set Up Game
          </button>
        </div>
      </div>
    )
  }

  const isMatchReady =
    match &&
    match.status === 'in_progress' &&
    match.team_a_points === 0 &&
    match.team_b_points === 0 &&
    match.team_a_games === 0 &&
    match.team_b_games === 0

  if (isMatchReady && match) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <Header status="ready" statusText="READY" courtName={courtName} branding={branding} />
        <div style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
          <TeamMatchupCard
            teamAPlayer1={match.team_a_player_1}
            teamAPlayer2={match.team_a_player_2}
            teamBPlayer1={match.team_b_player_1}
            teamBPlayer2={match.team_b_player_2}
            title="Match Ready"
            subtitle="Press a button on court to begin"
          />
        </div>
        <div style={{ paddingTop: '1rem' }}>
          <button className="btn btn-danger btn-block" onClick={handleEndGame}>
            End Game
          </button>
        </div>
      </div>
    )
  }

  const showPostGame =
    match &&
    (match.status === 'completed' || match.status === 'abandoned' || !!match.winner)

  if (showPostGame && match) {
    const isAbandoned = match.status === 'abandoned'
    const hasWinner = match.winner && !isAbandoned
    const winnerName = hasWinner
      ? match.winner === 'a'
        ? formatTeamName(match.team_a_player_1, match.team_a_player_2, 'Team A')
        : formatTeamName(match.team_b_player_1, match.team_b_player_2, 'Team B')
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
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <Header
          status="finished"
          statusText={isAbandoned ? 'GAME ENDED' : 'GAME FINISHED'}
          courtName={courtName}
          branding={branding}
        />
        <div style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
          <div
            className={`card-result ${hasWinner ? `${winnerTeam}-winner` : ''}`}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              ...(hasWinner && { borderTop: `3px solid var(--${winnerTeam})` }),
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              textAlign: 'center',
            }}
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
                color: 'var(--text-primary)',
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
        <div className="stack" style={{ paddingTop: '1rem' }}>
          <button className="btn btn-primary btn-block" onClick={handlePlayAgain}>
            Rematch
          </button>
          <button className="btn btn-secondary btn-block" onClick={handleNewGame}>
            Edit Match
          </button>
          <div className="divider"></div>
          <button className="btn btn-danger btn-block" onClick={handleEndSession}>
            End Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-padded" style={{ paddingTop: '1rem' }}>
      <Header status="live" statusText="LIVE" courtName={courtName} branding={branding} />
      <div style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
        <TeamMatchupCard
          teamAPlayer1={match?.team_a_player_1}
          teamAPlayer2={match?.team_a_player_2}
          teamBPlayer1={match?.team_b_player_1}
          teamBPlayer2={match?.team_b_player_2}
          title="Game in Progress"
          subtitle="Use the court buttons to score"
        />
      </div>
      <div style={{ paddingTop: '1rem' }}>
        <button className="btn btn-danger btn-block" onClick={handleEndGame}>
          End Game
        </button>
      </div>
    </div>
  )
}
