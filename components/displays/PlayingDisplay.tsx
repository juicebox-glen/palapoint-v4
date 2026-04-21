'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { validateSession, endSession } from '@/lib/api/session'
import Header from '@/components/ui/Header'
import MatchConfirmation, {
  type MatchConfirmationMatch,
} from '@/components/shared/MatchConfirmation'
import type { VenueBranding } from '@/lib/venue'
import MatchFinishedPanel from '@/components/shared/MatchFinishedPanel'
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
  team_a_player_1_photo?: string | null
  team_a_player_2_photo?: string | null
  team_b_player_1_photo?: string | null
  team_b_player_2_photo?: string | null
  session_id: string | null
  game_mode: string
  sets_to_win: number
  side_swap_enabled: boolean
  is_tiebreak?: boolean
}

/** Design-system preview only — mirrors production `PlayingDisplay` states without Supabase. */
export type PlayingDisplayPreviewScreen =
  | 'no_session'
  | 'session_ended'
  | 'session_ended_inactivity'
  | 'ready'
  | 'live'
  | 'postgame_win'
  /** Best-of-3, 2–0 (two set rows). */
  | 'postgame_win_3sweep'
  /** Best-of-3, 2–1 (three set rows). */
  | 'postgame_win_3split'
  | 'postgame_abandoned'

export interface PlayingDisplayPreviewConfig {
  screen: PlayingDisplayPreviewScreen
}

function buildPreviewMatch(overrides: Partial<MatchState> = {}): MatchState {
  return {
    id: 'preview-match',
    status: 'in_progress',
    team_a_points: 0,
    team_b_points: 0,
    team_a_games: 0,
    team_b_games: 0,
    set_scores: [],
    winner: null,
    session_id: 'preview-session',
    game_mode: 'traditional',
    sets_to_win: 1,
    side_swap_enabled: true,
    team_a_player_1: 'Glen Noble',
    team_a_player_2: 'Rob Anderson',
    team_b_player_1: 'Julian Waters',
    team_b_player_2: 'Carl Pettit',
    ...overrides,
  }
}

interface SessionState {
  valid: boolean
  reason?: string
  session?: unknown
}

interface PlayingDisplayProps {
  courtId: string
  courtSlug: string
  courtName: string
  branding?: VenueBranding | null
  /** Skips Supabase; renders a fixed screen for `/design-system/preview/playing`. */
  preview?: PlayingDisplayPreviewConfig
}

export default function PlayingDisplay({
  courtId,
  courtSlug,
  courtName,
  branding,
  preview,
}: PlayingDisplayProps) {
  const isPreview = Boolean(preview)
  const router = useRouter()
  const [loading, setLoading] = useState(() => !isPreview)
  const [match, setMatch] = useState<MatchState | null>(null)
  const [sessionState, setSessionState] = useState<SessionState | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (isPreview && preview) {
      setLoading(false)
      setSessionId(null)
      setSessionState(null)
      setMatch(null)
      switch (preview.screen) {
        case 'no_session':
          break
        case 'session_ended':
          setSessionId('preview-session-id')
          setSessionState({ valid: false, reason: 'ended' })
          break
        case 'session_ended_inactivity':
          setSessionId('preview-session-id')
          setSessionState({ valid: false, reason: 'expired_inactivity' })
          break
        case 'ready':
          setSessionId('preview-session-id')
          setSessionState({ valid: true })
          setMatch(buildPreviewMatch({ status: 'in_progress' }))
          break
        case 'live':
          setSessionId('preview-session-id')
          setSessionState({ valid: true })
          setMatch(
            buildPreviewMatch({
              team_a_points: 30,
              team_b_points: 15,
              team_a_games: 2,
              team_b_games: 1,
            })
          )
          break
        case 'postgame_win':
          setSessionId('preview-session-id')
          setSessionState({ valid: true })
          setMatch(
            buildPreviewMatch({
              status: 'completed',
              winner: 'a',
              team_a_games: 6,
              team_b_games: 4,
              set_scores: [{ team_a_games: 6, team_b_games: 4 }],
            })
          )
          break
        case 'postgame_win_3sweep':
          setSessionId('preview-session-id')
          setSessionState({ valid: true })
          setMatch(
            buildPreviewMatch({
              status: 'completed',
              winner: 'a',
              sets_to_win: 3,
              team_a_games: 2,
              team_b_games: 0,
              set_scores: [
                { team_a: 6, team_b: 2 },
                { team_a: 6, team_b: 4 },
              ],
            })
          )
          break
        case 'postgame_win_3split':
          setSessionId('preview-session-id')
          setSessionState({ valid: true })
          setMatch(
            buildPreviewMatch({
              status: 'completed',
              winner: 'a',
              sets_to_win: 3,
              team_a_games: 2,
              team_b_games: 1,
              set_scores: [
                { team_a: 6, team_b: 4 },
                { team_a: 4, team_b: 6 },
                { team_a: 6, team_b: 3 },
              ],
            })
          )
          break
        case 'postgame_abandoned':
          setSessionId('preview-session-id')
          setSessionState({ valid: true })
          setMatch(
            buildPreviewMatch({
              status: 'abandoned',
              sets_to_win: 3,
              team_a_games: 1,
              team_b_games: 1,
              set_scores: [
                { team_a: 6, team_b: 4 },
                { team_a: 3, team_b: 6 },
              ],
            })
          )
          break
        default:
          break
      }
      return
    }

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
  }, [courtId, courtSlug, isPreview, preview])

  useEffect(() => {
    if (isPreview || !courtId) return
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
  }, [courtId, isPreview])

  useEffect(() => {
    if (isPreview || !sessionId) return
    const interval = setInterval(async () => {
      const validation = await validateSession(sessionId)
      setSessionState(validation)
    }, 60000)
    return () => clearInterval(interval)
  }, [sessionId, isPreview])

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

  const showPostGame =
    match &&
    (match.status === 'completed' || match.status === 'abandoned' || !!match.winner)

  if (showPostGame && match) {
    return (
      <MatchFinishedPanel
        match={match}
        branding={branding ?? null}
        courtName={courtName}
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-block" onClick={handleNewGame}>
              EDIT MATCH
            </button>
            <button type="button" className="btn btn-primary btn-block" onClick={handlePlayAgain}>
              REMATCH
            </button>
            <div className="divider" />
            <button type="button" className="btn btn-danger btn-block" onClick={handleEndSession}>
              END SESSION
            </button>
          </>
        }
      />
    )
  }

  if (match?.status === 'in_progress' || match?.status === 'setup') {
    const isScoreless =
      match.team_a_points === 0 &&
      match.team_b_points === 0 &&
      match.team_a_games === 0 &&
      match.team_b_games === 0
    const showReady = match.status === 'setup' || isScoreless

    return (
      <MatchConfirmation
        match={match as unknown as MatchConfirmationMatch}
        branding={branding ?? null}
        courtName={courtName}
        statusLabel={showReady ? 'READY' : 'LIVE'}
        primaryMessage={
          showReady ? (
            <p
              className="preview-court-start-headline"
              role="status"
              aria-label="Press button on court to start"
            >
              Press button on
              <br />
              court to start
            </p>
          ) : undefined
        }
        actions={
          <button type="button" className="btn btn-danger btn-block" onClick={handleEndGame}>
            END GAME
          </button>
        }
      />
    )
  }

  if (!match) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <Header branding={branding} />
        <div className="page-loading" style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading match…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-padded" style={{ paddingTop: '1rem' }}>
      <Header branding={branding} />
      <div className="page-loading" style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Waiting for match to start…</p>
      </div>
    </div>
  )
}
