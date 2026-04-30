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
  tiebreak_at?: number
  side_swap_enabled: boolean
  is_tiebreak?: boolean
  started_at?: string | null
}

/** Coerce DB / JSON shapes so scoreless + ready checks stay reliable after REMATCH. */
function normalizePlayingMatch(row: MatchState | null): MatchState | null {
  if (!row) return null
  const setScores = Array.isArray(row.set_scores) ? row.set_scores : []
  return {
    ...row,
    team_a_points: Number(row.team_a_points) || 0,
    team_b_points: Number(row.team_b_points) || 0,
    team_a_games: Number(row.team_a_games) || 0,
    team_b_games: Number(row.team_b_games) || 0,
    set_scores: setScores,
    started_at: row.started_at ?? null,
    winner: row.winner ?? null,
  }
}

type LiveMatchesRealtimePayload = {
  eventType: string
  new?: MatchState
  old?: MatchState & { id?: string }
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
  const [isEnding, setIsEnding] = useState(false)

  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
              status: 'in_progress',
              started_at: new Date().toISOString(),
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

      setMatch(normalizePlayingMatch(matchData as MatchState | null))
      setLoading(false)
    }

    loadData()
  }, [courtId, courtSlug, isPreview, preview])

  useEffect(() => {
    if (isPreview) return
    console.log('[PlayingDisplay] match state:', {
      id: match?.id,
      status: match?.status,
      started_at: match?.started_at ?? null,
    })
  }, [isPreview, match])

  useEffect(() => {
    if (isPreview || !courtId) return

    async function refreshMatchFromDb() {
      const { data: matchData } = await supabase
        .from('live_matches')
        .select('*')
        .eq('court_id', courtId)
        .in('status', ['setup', 'in_progress', 'completed', 'abandoned'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      console.log('[PlayingDisplay] refetched live_matches after subscribe:', {
        id: matchData?.id,
        started_at: (matchData as MatchState | null)?.started_at,
      })
      setMatch(normalizePlayingMatch(matchData as MatchState | null))
    }

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
      (payload: LiveMatchesRealtimePayload) => {
        console.log('[PlayingDisplay] realtime live_matches:', payload.eventType, {
          id: payload.new?.id ?? payload.old?.id,
          started_at: payload.new?.started_at,
        })

        if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id
          setMatch((prev) => {
            if (!prev || !deletedId || deletedId !== prev.id) return prev
            return null
          })
          return
        }

        if (payload.eventType === 'INSERT' && payload.new) {
          setMatch(normalizePlayingMatch(payload.new as MatchState))
          return
        }

        if (payload.eventType === 'UPDATE' && payload.new) {
          const row = normalizePlayingMatch(payload.new as MatchState)!
          setMatch((prev) => {
            if (prev && row.id !== prev.id) return prev
            return row
          })
        }
      }
    )
    ch.subscribe((status: string) => {
      console.log('[PlayingDisplay] realtime channel status:', status)
      if (status === 'SUBSCRIBED') {
        void refreshMatchFromDb()
      }
    })
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
    const body: Record<string, unknown> = {
      action: 'create',
      court_id: courtId,
      session_id: sessionId,
      game_mode: match.game_mode,
      sets_to_win: match.sets_to_win ?? 1,
      tiebreak_at: match.tiebreak_at ?? 6,
      side_swap_enabled: match.side_swap_enabled ?? true,
    }
    if (match.team_a_player_1?.trim()) body.team_a_player_1 = match.team_a_player_1.trim()
    if (match.team_a_player_2?.trim()) body.team_a_player_2 = match.team_a_player_2.trim()
    if (match.team_b_player_1?.trim()) body.team_b_player_1 = match.team_b_player_1.trim()
    if (match.team_b_player_2?.trim()) body.team_b_player_2 = match.team_b_player_2.trim()
    body.team_a_player_1_photo = match.team_a_player_1_photo ?? null
    body.team_a_player_2_photo = match.team_a_player_2_photo ?? null
    body.team_b_player_1_photo = match.team_b_player_1_photo ?? null
    body.team_b_player_2_photo = match.team_b_player_2_photo ?? null

    const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = (await response.json()) as { success?: boolean; match?: MatchState }
    console.log('[PlayingDisplay] rematch create:', { ok: response.ok, success: result.success })
    if (result.success && result.match) {
      setMatch(normalizePlayingMatch(result.match))
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
      sessionStorage.setItem(
        `setup_tiebreak_${courtId}`,
        JSON.stringify((match.tiebreak_at ?? 6) === 6)
      )
      const players = [
        match.team_a_player_1 || '',
        match.team_a_player_2 || '',
        match.team_b_player_1 || '',
        match.team_b_player_2 || '',
      ]
      sessionStorage.setItem(`setup_players_${courtId}`, JSON.stringify(players))
      sessionStorage.setItem(
        `setup_photos_${courtId}`,
        JSON.stringify({
          team_a_player_1_photo: match.team_a_player_1_photo ?? null,
          team_a_player_2_photo: match.team_a_player_2_photo ?? null,
          team_b_player_1_photo: match.team_b_player_1_photo ?? null,
          team_b_player_2_photo: match.team_b_player_2_photo ?? null,
        })
      )
    }
    router.push(`/setup/${courtSlug}`)
  }

  const handleEndGame = async () => {
    if (isPreview || !match || !courtId) return
    setIsEnding(true)
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (ANON_KEY) headers.Authorization = `Bearer ${ANON_KEY}`

      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'end',
          court_id: courtId,
          reason: 'abandoned',
        }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean
        error?: string
      }
      console.log('[PlayingDisplay] end game response:', {
        ok: response.ok,
        success: data.success,
        error: data.error,
      })
      if (!response.ok || data.success === false) {
        console.error('[PlayingDisplay] end game failed:', data.error ?? response.status)
        return
      }

      const { data: row } = await supabase
        .from('live_matches')
        .select('*')
        .eq('court_id', courtId)
        .in('status', ['setup', 'in_progress', 'completed', 'abandoned'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (row) setMatch(normalizePlayingMatch(row as MatchState))
    } catch (err) {
      console.error('[PlayingDisplay] end game error:', err)
    } finally {
      setIsEnding(false)
    }
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
      Number(match.team_a_points) === 0 &&
      Number(match.team_b_points) === 0 &&
      Number(match.team_a_games) === 0 &&
      Number(match.team_b_games) === 0 &&
      (match.set_scores || []).length === 0
    /** Pre–first-FLIC: Edit Match only; after court ack (`started_at`): End Game */
    const isPreviewReady =
      !match.started_at &&
      isScoreless &&
      (match.status === 'setup' || match.status === 'in_progress')

    const isLive =
      Boolean(match.started_at) &&
      (match.status === 'in_progress' || match.status === 'setup')

    return (
      <MatchConfirmation
        match={match as unknown as MatchConfirmationMatch}
        branding={branding ?? null}
        courtName={courtName}
        idleFooterLayout
        statusLabel={isPreviewReady ? 'READY' : 'LIVE'}
        primaryMessage={
          isPreviewReady ? (
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
          isPreviewReady ? (
            <button type="button" className="btn btn-secondary btn-block" onClick={handleNewGame}>
              EDIT MATCH
            </button>
          ) : isLive ? (
            <button
              type="button"
              className="btn btn-danger btn-block"
              onClick={handleEndGame}
              disabled={isEnding || isPreview}
            >
              {isEnding ? 'ENDING…' : 'END GAME'}
            </button>
          ) : null
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
