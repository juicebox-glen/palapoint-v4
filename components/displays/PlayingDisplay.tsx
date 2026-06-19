'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { validateSession, endSession } from '@/lib/api/session'
import MatchConfirmation, {
  type MatchConfirmationMatch,
} from '@/components/shared/MatchConfirmation'
import PlayerFlowShell from '@/components/shared/PlayerFlowShell'
import SessionPromptCard from '@/components/shared/SessionPromptCard'
import PlayingReadyHero from '@/components/shared/PlayingReadyHero'
import type { VenueBranding } from '@/lib/venue'
import type { MatchState } from '@/lib/types/match'
import { isMatchPostGame } from '@/lib/utils/match-status'
import MatchFinishedPanel from '@/components/shared/MatchFinishedPanel'
import { supabaseFunctionHeaders, SUPABASE_URL } from '@/lib/api/supabase-functions'
import '@/app/styles/setup-form.css'

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
    set_scores: setScores as MatchState['set_scores'],
    started_at: row.started_at ?? null,
    winner: row.winner ?? null,
    deuce_count: Number(row.deuce_count) || 0,
    current_set: Number(row.current_set) || 1,
    is_tiebreak: Boolean(row.is_tiebreak),
    serving_team: row.serving_team ?? null,
  }
}

/** Waiting for first court FLIC ack (`started_at`) — realtime sometimes misses the UPDATE. */
function isAwaitingCourtAck(m: MatchState | null): boolean {
  if (!m) return false
  if (!(m.status === 'setup' || m.status === 'in_progress')) return false
  if (m.started_at) return false
  const setScores = Array.isArray(m.set_scores) ? m.set_scores : []
  return (
    Number(m.team_a_points) === 0 &&
    Number(m.team_b_points) === 0 &&
    Number(m.team_a_games) === 0 &&
    Number(m.team_b_games) === 0 &&
    setScores.length === 0
  )
}

/** Match has started on court and is still active — poll periodically so completion isn't missed if realtime drops. */
function isLivePlayingMatch(m: MatchState | null): boolean {
  if (!m) return false
  return Boolean(m.started_at) && (m.status === 'in_progress' || m.status === 'setup')
}

async function fetchLatestLiveMatchForCourt(courtId: string): Promise<MatchState | null> {
  const { data, error } = await supabase
    .from('live_matches')
    .select('*')
    .eq('court_id', courtId)
    .in('status', ['setup', 'in_progress', 'completed', 'abandoned'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.warn('[PlayingDisplay] fetchLatestLiveMatchForCourt:', error.message)
    return null
  }
  return normalizePlayingMatch(data as MatchState | null)
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
    court_id: 'preview-court',
    version: 0,
    game_mode: 'traditional',
    sets_to_win: 1,
    tiebreak_at: 6,
    status: 'in_progress',
    current_set: 1,
    is_tiebreak: false,
    team_a_points: 0,
    team_b_points: 0,
    team_a_games: 0,
    team_b_games: 0,
    set_scores: [],
    deuce_count: 0,
    serving_team: null,
    winner: null,
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

  const matchRef = useRef<MatchState | null>(null)
  matchRef.current = match

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
              serving_team: 'a',
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
              set_scores: [{ team_a: 6, team_b: 4 }],
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

      const row = await fetchLatestLiveMatchForCourt(courtId)
      setMatch(row)
      setLoading(false)
    }

    loadData()
  }, [courtId, courtSlug, isPreview, preview])

  useEffect(() => {
    if (isPreview || !courtId) return

    async function refreshMatchFromDb() {
      const row = await fetchLatestLiveMatchForCourt(courtId)
      setMatch(row)
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
          const raw = payload.new as MatchState
          if (!raw?.id) {
            console.warn('[PlayingDisplay] realtime UPDATE missing id; refetching row')
            void fetchLatestLiveMatchForCourt(courtId).then((row) => {
              if (row) setMatch(row)
            })
            return
          }
          const row = normalizePlayingMatch(raw)!
          setMatch((prev) => {
            if (prev && row.id !== prev.id) return prev
            return row
          })
        }
      }
    )
    ch.subscribe((status: string, err?: Error) => {
      console.log('[PlayingDisplay] realtime channel status:', status, err?.message ?? '')
      if (status === 'SUBSCRIBED') {
        void refreshMatchFromDb()
        return
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[PlayingDisplay] realtime channel recover:', status)
        void refreshMatchFromDb()
      }
    })
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [courtId, isPreview])

  /**
   * Poll while awaiting first FLIC ack (fast) and during live play (slower) so completion reaches the player
   * screen even when realtime misses updates. Stops when match leaves those states (e.g. completed).
   */
  useEffect(() => {
    if (isPreview || !courtId || !match) return

    const awaitingAck = isAwaitingCourtAck(match)
    const livePlaying = isLivePlayingMatch(match)
    if (!awaitingAck && !livePlaying) return

    const intervalMs = awaitingAck ? 2000 : 5000

    const poll = async () => {
      const row = await fetchLatestLiveMatchForCourt(courtId)
      if (!row) return
      setMatch(row)
    }

    void poll()
    const iv = setInterval(() => void poll(), intervalMs)
    return () => clearInterval(iv)
  }, [isPreview, courtId, match?.id, match?.started_at, match?.status])

  useEffect(() => {
    if (isPreview || !courtId) return
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const prev = matchRef.current
      if (!prev) return
      const shouldRefetch =
        isAwaitingCourtAck(prev) || isLivePlayingMatch(prev)
      if (!shouldRefetch) return
      void fetchLatestLiveMatchForCourt(courtId).then((row) => {
        if (!row) return
        setMatch(row)
      })
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [isPreview, courtId])

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
      headers: supabaseFunctionHeaders(),
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
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: supabaseFunctionHeaders(),
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

      const row = await fetchLatestLiveMatchForCourt(courtId)
      if (row) setMatch(row)
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
      <PlayerFlowShell branding={branding ?? null}>
        <div className="player-flow-loading">
          <p className="page-loading-message">Loading...</p>
        </div>
      </PlayerFlowShell>
    )
  }

  if (sessionState && !sessionState.valid) {
    return (
      <PlayerFlowShell branding={branding ?? null}>
        <div className="player-flow-prompt-wrap">
          <SessionPromptCard
            title="Session Ended"
            warning={
              sessionState.reason === 'expired_inactivity'
                ? 'Your session expired due to inactivity.'
                : 'This session has ended.'
            }
            actions={
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => router.push(`/setup/${courtSlug}`)}
              >
                Start New Session
              </button>
            }
          />
        </div>
      </PlayerFlowShell>
    )
  }

  if (!sessionId) {
    return (
      <PlayerFlowShell branding={branding ?? null}>
        <div className="player-flow-prompt-wrap">
          <SessionPromptCard
            title="No Active Session"
            warning="Scan the QR code on the court to start a session."
            actions={
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => router.push(`/setup/${courtSlug}`)}
              >
                Set Up Game
              </button>
            }
          />
        </div>
      </PlayerFlowShell>
    )
  }

  if (match && isMatchPostGame(match)) {
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
    /** Pre–first-FLIC: hero instruction + Edit Match; after court ack (`started_at`): End Game */
    const isPreviewReady = isAwaitingCourtAck(match)

    const isLive =
      Boolean(match.started_at) &&
      (match.status === 'in_progress' || match.status === 'setup')

    return (
      <MatchConfirmation
        match={match as MatchConfirmationMatch}
        scoreboardMatch={isLive ? match : null}
        playerView
        branding={branding ?? null}
        courtName={courtName}
        idleFooterLayout
        statusLabel={isPreviewReady ? 'READY' : 'LIVE'}
        readyStateFooter={
          isPreviewReady ? <PlayingReadyHero onEditMatch={handleNewGame} /> : undefined
        }
        actions={
          isPreviewReady
            ? undefined
            : isLive
              ? (
                  <button
                    type="button"
                    className="btn btn-danger btn-block"
                    onClick={handleEndGame}
                    disabled={isEnding || isPreview}
                  >
                    {isEnding ? 'ENDING…' : 'END GAME'}
                  </button>
                )
              : null
        }
      />
    )
  }

  if (!match) {
    return (
      <PlayerFlowShell branding={branding ?? null}>
        <div className="player-flow-loading">
          <p className="page-loading-message">Loading match…</p>
        </div>
      </PlayerFlowShell>
    )
  }

  return (
    <PlayerFlowShell branding={branding ?? null}>
      <div className="player-flow-loading">
        <p className="page-loading-message">Waiting for match to start…</p>
      </div>
    </PlayerFlowShell>
  )
}
