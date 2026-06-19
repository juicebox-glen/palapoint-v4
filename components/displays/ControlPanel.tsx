'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import MatchSetupForm from '@/components/MatchSetupForm'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import ControlMatchPreview from '@/components/displays/ControlMatchPreview'
import MatchFinishedPanel from '@/components/shared/MatchFinishedPanel'
import ControlScoreboard from '@/components/shared/ControlScoreboard'
import {
  matchPreviewModeBadgeLabel,
  matchPreviewSetsBadgeLabel,
} from '@/components/shared/MatchConfirmation'
import { EMPTY_PLAYER_PHOTOS, type GameMode, type MatchState, type PlayerPhotosState } from '@/lib/types/match'
import { brandingStylesFor, type VenueBranding } from '@/lib/venue'
import { formatTeamDisplay } from '@/lib/utils/name-format'
import { shufflePlayersWithPhotos } from '@/lib/utils/shuffle-players'
import { isMatchEndgame } from '@/lib/utils/match-status'
import { generateUuid } from '@/lib/utils/uuid'
import { supabaseFunctionHeaders, SUPABASE_URL } from '@/lib/api/supabase-functions'
import '@/app/styles/setup-form.css'
import '@/app/styles/control-panel.css'

type ControlStage = 'setup' | 'preview' | 'live'

/** Design-system preview: skips Supabase load/realtime and network actions. */
export type ControlPanelPreviewScreen = 'setup' | 'preview' | 'live' | 'endgame'

export interface ControlPanelPreviewConfig {
  screen: ControlPanelPreviewScreen
  /** Setup screen only: prefilled player names */
  setupPlayers?: [string, string, string, string]
  /** Preview / live / endgame: injected match */
  match?: MatchState | null
}

interface ControlPanelProps {
  courtId: string
  branding?: VenueBranding | null
  /** Same label as player flow (e.g. COURT 1). */
  courtName?: string
  /** When set, skips Supabase/realtime and uses static data for design system previews. */
  preview?: ControlPanelPreviewConfig
}

function initialPlayersFromPreview(preview: ControlPanelPreviewConfig | undefined): string[] {
  if (!preview) return ['', '', '', '']
  if (preview.screen === 'setup' && preview.setupPlayers) {
    return [...preview.setupPlayers]
  }
  if (preview.match) {
    const m = preview.match
    return [
      m.team_a_player_1 ?? '',
      m.team_a_player_2 ?? '',
      m.team_b_player_1 ?? '',
      m.team_b_player_2 ?? '',
    ]
  }
  return ['Glen Noble', 'Rob Anderson', 'Julian Waters', 'Carl Pettit']
}

function initialStageFromPreview(preview: ControlPanelPreviewConfig | undefined): ControlStage {
  if (!preview) return 'setup'
  if (preview.screen === 'preview') return 'preview'
  if (preview.screen === 'live') return 'live'
  return 'setup'
}

function initialMatchFromPreview(preview: ControlPanelPreviewConfig | undefined): MatchState | null {
  if (!preview || preview.screen === 'setup') return null
  return preview.match ?? null
}

export default function ControlPanel({
  courtId,
  branding,
  courtName,
  preview,
}: ControlPanelProps) {
  const displayCourtName = courtName ?? branding?.courtName ?? 'Court 1'
  const isPreview = Boolean(preview)
  const [match, setMatch] = useState<MatchState | null>(() => initialMatchFromPreview(preview))
  const [loading, setLoading] = useState(() => !isPreview)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const [gameMode, setGameMode] = useState<GameMode>(() => preview?.match?.game_mode ?? 'traditional')
  const [setsToWin, setSetsToWin] = useState<1 | 2>(() =>
    preview?.match?.sets_to_win === 2 ? 2 : 1
  )
  const [sideSwapEnabled, setSideSwapEnabled] = useState(() => preview?.match?.side_swap_enabled ?? true)
  const [endGameInTiebreak, setEndGameInTiebreak] = useState(
    () => (preview?.match?.tiebreak_at ?? 6) === 6
  )
  const [players, setPlayers] = useState<string[]>(() => initialPlayersFromPreview(preview))
  const [tempMatchId] = useState(() => generateUuid())
  const [playerPhotos, setPlayerPhotos] = useState<PlayerPhotosState>(() =>
    preview?.match
      ? {
          team_a_player_1_photo: preview.match.team_a_player_1_photo ?? null,
          team_a_player_2_photo: preview.match.team_a_player_2_photo ?? null,
          team_b_player_1_photo: preview.match.team_b_player_1_photo ?? null,
          team_b_player_2_photo: preview.match.team_b_player_2_photo ?? null,
        }
      : EMPTY_PLAYER_PHOTOS
  )
  const [stage, setStage] = useState<ControlStage>(() => initialStageFromPreview(preview))

  const handlePlayerPhotoChange = useCallback(
    (key: keyof PlayerPhotosState, url: string | null) => {
      setPlayerPhotos((prev) => ({ ...prev, [key]: url }))
    },
    []
  )

  useEffect(() => {
    if (isPreview) {
      setLoading(false)
      return
    }
    if (!courtId) return

    let channel: ReturnType<typeof supabase.channel> | null = null

    async function loadMatch() {
      try {
        const { data, error: fetchError } = await supabase
          .from('live_matches')
          .select('*')
          .eq('court_id', courtId)
          .in('status', ['setup', 'in_progress', 'completed', 'abandoned'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fetchError) {
          console.error('Error loading match:', fetchError)
          setError('Failed to load match')
        } else if (data) {
          const m = { ...data } as MatchState
          setMatch(m)
          if (m.status === 'setup') setStage('preview')
          else if (m.status === 'in_progress') setStage('live')
        } else {
          setMatch(null)
          setStage('setup')
        }
        setLoading(false)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Unexpected error occurred')
        setLoading(false)
      }
    }

    loadMatch()

    const ch = supabase.channel(`control-${courtId}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase RealtimeChannel overload
    ;(ch as any).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_matches',
        filter: `court_id=eq.${courtId}`,
      },
      (payload: { eventType: string; new?: MatchState; data?: { new?: MatchState } }) => {
        if (payload.eventType === 'DELETE') {
          setMatch(null)
          setStage('setup')
          return
        }
        const raw = payload.new ?? (payload as { data?: { new?: MatchState } }).data?.new
        if (!raw) return
        const updatedMatch = { ...raw } as MatchState
        if (updatedMatch.status === 'setup' || updatedMatch.status === 'in_progress') {
          setMatch(updatedMatch)
          if (updatedMatch.status === 'in_progress') setStage('live')
        } else if (updatedMatch.status === 'completed' || updatedMatch.status === 'abandoned') {
          setMatch(updatedMatch)
        }
      }
    )
    channel = ch.subscribe()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        supabase
          .from('live_matches')
          .select('*')
          .eq('court_id', courtId)
          .in('status', ['setup', 'in_progress', 'completed', 'abandoned'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              const m = { ...data } as MatchState
              setMatch(m)
              if (m.status === 'in_progress') setStage('live')
              else if (m.status === 'setup') setStage('preview')
            } else {
              setMatch(null)
              setStage('setup')
            }
          })
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (channel) supabase.removeChannel(channel)
    }
  }, [courtId, isPreview])

  function handlePlayerChange(index: number, value: string) {
    const next = [...players]
    next[index] = value
    setPlayers(next)
  }

  function handleRandomize() {
    const { players: nextPlayers, playerPhotos: nextPhotos } = shufflePlayersWithPhotos(
      players,
      playerPhotos
    )
    setPlayers(nextPlayers)
    setPlayerPhotos(nextPhotos)
  }

  async function handleContinue() {
    if (isPreview) return
    if (!courtId) return
    const updating = !!match && match.status === 'setup'
    setActionLoading('continue')
    setError(null)
    try {
      const body: Record<string, unknown> = {
        court_id: courtId,
        game_mode: gameMode,
        sets_to_win: setsToWin,
        side_swap_enabled: sideSwapEnabled,
        tiebreak_at: endGameInTiebreak ? 6 : 6,
      }
      if (players[0]?.trim()) body.team_a_player_1 = players[0].trim()
      if (players[1]?.trim()) body.team_a_player_2 = players[1].trim()
      if (players[2]?.trim()) body.team_b_player_1 = players[2].trim()
      if (players[3]?.trim()) body.team_b_player_2 = players[3].trim()
      body.team_a_player_1_photo = playerPhotos.team_a_player_1_photo
      body.team_a_player_2_photo = playerPhotos.team_a_player_2_photo
      body.team_b_player_1_photo = playerPhotos.team_b_player_1_photo
      body.team_b_player_2_photo = playerPhotos.team_b_player_2_photo

      if (updating) {
        body.action = 'update_setup'
        body.match_id = match!.id
      } else {
        body.action = 'create'
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: supabaseFunctionHeaders(),
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!data.success) {
        setError(data.error || (updating ? 'Failed to update match' : 'Failed to create match'))
      } else if (data.match) {
        setMatch(data.match as MatchState)
        setStage('preview')
      }
    } catch (err) {
      console.error('Error saving match:', err)
      setError('Failed to save match')
    }
    setActionLoading(null)
  }

  function handleBackToEdit() {
    if (isPreview) return
    if (!match || match.status !== 'setup') return
    prefillFormFromMatch(match)
    setStage('setup')
  }

  async function handleStartMatch() {
    if (isPreview) return
    if (!match || match.status !== 'setup') return
    setActionLoading('start')
    setError(null)
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: supabaseFunctionHeaders(),
        body: JSON.stringify({
          action: 'start',
          match_id: match.id,
          court_id: courtId,
        }),
      })
      const data = await response.json()
      if (!data.success) {
        setError(data.error || 'Failed to start match')
      } else if (data.match) {
        setMatch(data.match as MatchState)
        setStage('live')
      }
    } catch (err) {
      console.error('Error starting match:', err)
      setError('Failed to start match')
    }
    setActionLoading(null)
  }

  async function scorePoint(team: 'a' | 'b') {
    if (isPreview) return
    if (!courtId) return
    setActionLoading(`score-${team}`)
    setError(null)
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/score`, {
        method: 'POST',
        headers: supabaseFunctionHeaders(),
        body: JSON.stringify({ court_id: courtId, team, source: 'control_panel' }),
      })
      const data = await response.json()
      if (!data.success) setError(data.error || 'Failed to score point')
    } catch (err) {
      console.error('Error scoring point:', err)
      setError('Failed to score point')
    }
    setActionLoading(null)
  }

  async function undoLastPoint() {
    if (isPreview) return
    if (!courtId) return
    setActionLoading('undo')
    setError(null)
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: supabaseFunctionHeaders(),
        body: JSON.stringify({ action: 'undo', court_id: courtId }),
      })
      const data = await response.json()
      if (!data.success) setError(data.error || 'Failed to undo')
    } catch (err) {
      console.error('Error undoing:', err)
      setError('Failed to undo')
    }
    setActionLoading(null)
  }

  async function endMatch() {
    if (isPreview) return
    if (!courtId) return
    setActionLoading('end')
    setError(null)
    setShowEndConfirm(false)
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: supabaseFunctionHeaders(),
        body: JSON.stringify({ action: 'end', court_id: courtId, reason: 'abandoned' }),
      })
      const data = await response.json()
      if (!data.success) setError(data.error || 'Failed to end match')
    } catch (err) {
      console.error('Error ending match:', err)
      setError('Failed to end match')
    }
    setActionLoading(null)
  }

  function prefillFormFromMatch(m: MatchState) {
    setPlayers([
      m.team_a_player_1 ?? '',
      m.team_a_player_2 ?? '',
      m.team_b_player_1 ?? '',
      m.team_b_player_2 ?? '',
    ])
    setPlayerPhotos({
      team_a_player_1_photo: m.team_a_player_1_photo ?? null,
      team_a_player_2_photo: m.team_a_player_2_photo ?? null,
      team_b_player_1_photo: m.team_b_player_1_photo ?? null,
      team_b_player_2_photo: m.team_b_player_2_photo ?? null,
    })
    setGameMode(m.game_mode)
    setSetsToWin((m.sets_to_win === 2 ? 2 : 1) as 1 | 2)
    setSideSwapEnabled(m.side_swap_enabled ?? true)
    setEndGameInTiebreak((m.tiebreak_at ?? 6) === 6)
  }

  async function handleRematch() {
    if (isPreview) return
    if (!courtId || !match) return
    setActionLoading('rematch')
    setError(null)
    try {
      const body: Record<string, unknown> = {
        action: 'create',
        court_id: courtId,
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
      const data = await response.json()
      if (!data.success) {
        setError(data.error || 'Failed to create match')
      } else if (data.match) {
        setMatch(data.match as MatchState)
        setStage('preview')
      }
    } catch (err) {
      console.error('Error in rematch:', err)
      setError('Failed to create match')
    }
    setActionLoading(null)
  }

  function handleEditMatch() {
    if (isPreview) return
    if (!match) return
    prefillFormFromMatch(match)
    setMatch(null)
    setStage('setup')
  }

  const renderSetupForm = () => (
    <MatchSetupForm
      gameMode={gameMode}
      setGameMode={setGameMode}
      setsToWin={setsToWin}
      setSetsToWin={setSetsToWin}
      players={players}
      onPlayerChange={handlePlayerChange}
      onRandomize={handleRandomize}
      tempMatchId={tempMatchId}
      playerPhotos={playerPhotos}
      onPlayerPhotoChange={handlePlayerPhotoChange}
      sideSwapEnabled={sideSwapEnabled}
      setSideSwapEnabled={setSideSwapEnabled}
      endGameInTiebreak={endGameInTiebreak}
      setEndGameInTiebreak={setEndGameInTiebreak}
      onSubmit={handleContinue}
      submitLoading={actionLoading === 'continue'}
      submitLabel="Continue"
      error={error}
      showHeader
      branding={branding}
    />
  )

  if (loading) {
    return (
      <div
        className="page page-padded"
        style={{ paddingTop: '1rem', ...brandingStylesFor(branding) }}
      >
        <SetupScreenHeader branding={branding} />
        <div className="page-loading" style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !match) {
    return (
      <div
        className="page page-padded"
        style={{ paddingTop: '1rem', ...brandingStylesFor(branding) }}
      >
        <SetupScreenHeader branding={branding} />
        <div className="page-loading" style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
          <p style={{ fontSize: '1.5rem', color: 'var(--error)' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!match) {
    return renderSetupForm()
  }

  if (isMatchEndgame(match)) {
    return (
      <MatchFinishedPanel
        match={match}
        branding={branding ?? null}
        courtName={displayCourtName}
        error={error}
        actions={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={handleEditMatch}
              disabled={!!actionLoading}
            >
              EDIT MATCH
            </button>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => void handleRematch()}
              disabled={!!actionLoading}
            >
              {actionLoading === 'rematch' ? '…' : 'REMATCH'}
            </button>
          </>
        }
      />
    )
  }

  if (match.status === 'setup') {
    if (stage === 'preview') {
      return (
        <ControlMatchPreview
          match={match}
          branding={branding}
          courtName={displayCourtName}
          onBackToEdit={handleBackToEdit}
          onStartMatch={handleStartMatch}
          loading={actionLoading === 'start'}
          error={error}
        />
      )
    }
    return renderSetupForm()
  }

  if (match.status !== 'in_progress') {
    return null
  }

  const teamAName = formatTeamDisplay(match.team_a_player_1, match.team_a_player_2, 1)
  const teamBName = formatTeamDisplay(match.team_b_player_1, match.team_b_player_2, 2)

  return (
    <div className="control-panel" style={brandingStylesFor(branding)}>
      <div className="control-container control-container--preview">
        <div className="control-preview">
          <SetupScreenHeader branding={branding} />

          <div className="preview-header">
            <div className="preview-status">
              <span className="preview-status-dot" aria-hidden />
              <span>LIVE</span>
            </div>
            <div className="preview-court">{displayCourtName}</div>
          </div>

          {error && <div className="control-error-message">{error}</div>}

          <ControlScoreboard match={match} />

          <div className="preview-badges">
            <span className="preview-badge">{matchPreviewSetsBadgeLabel(match.sets_to_win)}</span>
            <span className="preview-badge">{matchPreviewModeBadgeLabel(match.game_mode)}</span>
          </div>

          <div className="control-live-thumb-zone">
            <div className="control-score-buttons">
              <button
                type="button"
                className={`control-score-button control-score-button-a ${actionLoading === 'score-a' ? 'loading' : ''}`}
                onClick={() => scorePoint('a')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'score-a' ? '...' : `+ ${teamAName}`}
              </button>
              <button
                type="button"
                className={`control-score-button control-score-button-b ${actionLoading === 'score-b' ? 'loading' : ''}`}
                onClick={() => scorePoint('b')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'score-b' ? '...' : `+ ${teamBName}`}
              </button>
            </div>

            <div className="control-actions">
              <button
                type="button"
                className="control-button"
                onClick={undoLastPoint}
                disabled={!!actionLoading}
              >
                {actionLoading === 'undo' ? 'Undoing...' : 'UNDO'}
              </button>
              <button
                type="button"
                className="control-button control-button-danger"
                onClick={() => setShowEndConfirm(true)}
                disabled={!!actionLoading}
              >
                END MATCH
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEndConfirm && (
        <div className="control-modal-overlay" onClick={() => setShowEndConfirm(false)}>
          <div className="control-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="control-modal-title">End Match?</h2>
            <p className="control-modal-text">Are you sure you want to end this match?</p>
            <div className="control-modal-buttons">
              <button className="control-button" onClick={() => setShowEndConfirm(false)}>
                Cancel
              </button>
              <button
                className="control-button control-button-danger"
                onClick={endMatch}
                disabled={actionLoading === 'end'}
              >
                {actionLoading === 'end' ? 'Ending...' : 'End Match'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
