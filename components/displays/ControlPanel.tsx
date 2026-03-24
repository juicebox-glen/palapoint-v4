'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import MatchSetupForm from '@/components/MatchSetupForm'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import ControlMatchPreview from '@/components/displays/ControlMatchPreview'
import { EMPTY_PLAYER_PHOTOS, type GameMode, type MatchState, type PlayerPhotosState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'
import { formatPointDisplay, buildTeamNameAbbreviated } from '@/lib/utils/score-format'
import { getPointSituation } from '@/lib/utils/point-situation'
import { shufflePlayersWithPhotos } from '@/lib/utils/shuffle-players'
import '@/app/styles/setup-form.css'
import '@/app/styles/control-panel.css'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

type ControlStage = 'setup' | 'preview' | 'live'

interface ControlPanelProps {
  courtId: string
  branding?: VenueBranding | null
}

function getEndgameSetScores(m: MatchState) {
  if (m.set_scores && m.set_scores.length > 0) return m.set_scores
  return [{ team_a: m.team_a_games ?? 0, team_b: m.team_b_games ?? 0 }]
}

export default function ControlPanel({ courtId, branding }: ControlPanelProps) {
  const [match, setMatch] = useState<MatchState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const [gameMode, setGameMode] = useState<GameMode>('traditional')
  const [setsToWin, setSetsToWin] = useState<1 | 2>(1)
  const [sideSwapEnabled, setSideSwapEnabled] = useState(true)
  const [endGameInTiebreak, setEndGameInTiebreak] = useState(true)
  const [players, setPlayers] = useState<string[]>(['', '', '', ''])
  const [tempMatchId] = useState(() => crypto.randomUUID())
  const [playerPhotos, setPlayerPhotos] = useState<PlayerPhotosState>(EMPTY_PLAYER_PHOTOS)
  const [stage, setStage] = useState<ControlStage>('setup')

  const handlePlayerPhotoChange = useCallback(
    (key: keyof PlayerPhotosState, url: string | null) => {
      setPlayerPhotos((prev) => ({ ...prev, [key]: url }))
    },
    []
  )

  useEffect(() => {
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
  }, [courtId])

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
        headers: { 'Content-Type': 'application/json' },
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
    if (!match || match.status !== 'setup') return
    prefillFormFromMatch(match)
    setStage('setup')
  }

  async function handleStartMatch() {
    if (!match || match.status !== 'setup') return
    setActionLoading('start')
    setError(null)
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    if (!courtId) return
    setActionLoading(`score-${team}`)
    setError(null)
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    if (!courtId) return
    setActionLoading('undo')
    setError(null)
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    if (!courtId) return
    setActionLoading('end')
    setError(null)
    setShowEndConfirm(false)
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  async function handlePlayAgain() {
    if (!courtId || !match) return
    setActionLoading('play-again')
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
        headers: { 'Content-Type': 'application/json' },
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
      console.error('Error in play again:', err)
      setError('Failed to create match')
    }
    setActionLoading(null)
  }

  function handleEditAndPlayAgain() {
    if (!match) return
    prefillFormFromMatch(match)
    setMatch(null)
    setStage('setup')
  }

  async function handleClearCompletedMatch() {
    if (!courtId || !match) return
    setActionLoading('clear')
    setError(null)
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear_match',
          match_id: match.id,
          court_id: courtId,
        }),
      })
      const data = await response.json()
      if (!data.success) {
        setError(data.error || 'Failed to clear match')
      } else {
        setMatch(null)
        setStage('setup')
      }
    } catch (err) {
      console.error('Error clearing match:', err)
      setError('Failed to clear match')
    }
    setActionLoading(null)
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
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <SetupScreenHeader branding={branding} />
        <div className="page-loading" style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !match) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <SetupScreenHeader branding={branding} />
        <div className="page-loading" style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
          <p style={{ fontSize: '1.5rem', color: 'var(--color-error)' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!match) {
    return renderSetupForm()
  }

  const showEndgame =
    match.status === 'completed' ||
    match.status === 'abandoned' ||
    (match.winner != null && match.status !== 'setup' && match.status !== 'in_progress')

  if (showEndgame) {
    const endgameSets = getEndgameSetScores(match)
    return (
      <div className="control-panel">
        <div className="control-container">
          <SetupScreenHeader branding={branding} />
          {error && <div className="control-error-message">{error}</div>}

          <div className="control-endgame">
            <div className="endgame-header">
              <span className="endgame-badge">FINAL</span>
            </div>

            <div className="endgame-result">
              <div
                className={`endgame-team ${match.winner === 'a' ? 'endgame-winner' : ''}`}
              >
                <div className="endgame-team-photos">
                  {match.team_a_player_1_photo ? (
                    <img src={match.team_a_player_1_photo} alt="" className="endgame-photo" />
                  ) : (
                    <div className="endgame-avatar" aria-hidden>
                      {match.team_a_player_1?.trim()?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  {match.team_a_player_2_photo ? (
                    <img src={match.team_a_player_2_photo} alt="" className="endgame-photo" />
                  ) : (
                    <div className="endgame-avatar" aria-hidden>
                      {match.team_a_player_2?.trim()?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="endgame-names">
                  <span>{match.team_a_player_1?.trim() || '—'}</span>
                  <span>{match.team_a_player_2?.trim() || '—'}</span>
                </div>
                {match.winner === 'a' && (
                  <span className="endgame-winner-badge">WINNER</span>
                )}
              </div>

              <div className="endgame-score">
                {endgameSets.map((set, i) => {
                  const a = set.team_a ?? (set as { team_a_games?: number }).team_a_games ?? 0
                  const b = set.team_b ?? (set as { team_b_games?: number }).team_b_games ?? 0
                  return (
                    <div key={i} className="endgame-set">
                      <span className={match.winner === 'a' ? 'endgame-set-winner' : ''}>{a}</span>
                      <span className="endgame-set-divider">-</span>
                      <span className={match.winner === 'b' ? 'endgame-set-winner' : ''}>{b}</span>
                    </div>
                  )
                })}
              </div>

              <div
                className={`endgame-team ${match.winner === 'b' ? 'endgame-winner' : ''}`}
              >
                <div className="endgame-team-photos">
                  {match.team_b_player_1_photo ? (
                    <img src={match.team_b_player_1_photo} alt="" className="endgame-photo" />
                  ) : (
                    <div className="endgame-avatar" aria-hidden>
                      {match.team_b_player_1?.trim()?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  {match.team_b_player_2_photo ? (
                    <img src={match.team_b_player_2_photo} alt="" className="endgame-photo" />
                  ) : (
                    <div className="endgame-avatar" aria-hidden>
                      {match.team_b_player_2?.trim()?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="endgame-names">
                  <span>{match.team_b_player_1?.trim() || '—'}</span>
                  <span>{match.team_b_player_2?.trim() || '—'}</span>
                </div>
                {match.winner === 'b' && (
                  <span className="endgame-winner-badge">WINNER</span>
                )}
              </div>
            </div>

            <div className="endgame-actions">
              <button
                type="button"
                className="control-button control-button-primary"
                onClick={() => void handlePlayAgain()}
                disabled={!!actionLoading}
              >
                {actionLoading === 'play-again' ? '…' : 'Play Again'}
              </button>
              <button
                type="button"
                className="control-button"
                onClick={handleEditAndPlayAgain}
                disabled={!!actionLoading}
              >
                Edit &amp; Play Again
              </button>
              <button
                type="button"
                className="control-button control-button-danger"
                onClick={() => void handleClearCompletedMatch()}
                disabled={!!actionLoading}
              >
                {actionLoading === 'clear' ? '…' : 'End'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (match.status === 'setup') {
    if (stage === 'preview') {
      return (
        <ControlMatchPreview
          match={match}
          branding={branding}
          onBack={handleBackToEdit}
          onStart={handleStartMatch}
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

  const teamAName = buildTeamNameAbbreviated(match.team_a_player_1, match.team_a_player_2, 'Team A')
  const teamBName = buildTeamNameAbbreviated(match.team_b_player_1, match.team_b_player_2, 'Team B')
  const pointsA = formatPointDisplay(
    match.team_a_points,
    match.team_b_points,
    match.is_tiebreak,
    match.is_tiebreak ? match.tiebreak_scores?.team_a : undefined
  )
  const pointsB = formatPointDisplay(
    match.team_b_points,
    match.team_a_points,
    match.is_tiebreak,
    match.is_tiebreak ? match.tiebreak_scores?.team_b : undefined
  )
  const matchSetsToWin = match.sets_to_win ?? 1
  const setsWonA = (match.set_scores ?? []).filter((s) => s.team_a > s.team_b).length
  const setsWonB = (match.set_scores ?? []).filter((s) => s.team_b > s.team_a).length
  const gameModeLabel =
    match.game_mode === 'traditional'
      ? 'Standard'
      : match.game_mode === 'golden_point'
        ? 'Golden Point'
        : 'Silver Point'
  const pointSituation = getPointSituation(match)

  return (
    <div className="control-panel">
      <div className="control-container">
        <SetupScreenHeader branding={branding} />
        <header className="control-header">
          <span className="control-live">
            <span className="control-live-dot" aria-hidden />
            LIVE
          </span>
          <span className="control-game-mode">{gameModeLabel}</span>
        </header>

        {error && <div className="control-error-message">{error}</div>}

        <div className="control-scoreboard">
          <div className="control-scoreboard-cols">
            <div className="control-scoreboard-col">
              {match.serving_team === 'a' && (
                <div className="control-server-bar control-server-bar-a" aria-hidden />
              )}
              <div className="control-scoreboard-name">{teamAName}</div>
              <div className="control-scoreboard-point">{pointsA}</div>
            </div>
            <div className="control-scoreboard-col">
              {match.serving_team === 'b' && (
                <div className="control-server-bar control-server-bar-b" aria-hidden />
              )}
              <div className="control-scoreboard-name">{teamBName}</div>
              <div className="control-scoreboard-point">{pointsB}</div>
            </div>
          </div>
          <div className="control-scoreboard-sets-row">
            <div className="control-scoreboard-sets">
              {Array.from({ length: matchSetsToWin }).map((_, i) => (
                <span
                  key={i}
                  className={`control-scoreboard-set-dot team-a ${i < setsWonA ? 'won' : ''}`}
                  aria-hidden
                />
              ))}
            </div>
            <div className="control-scoreboard-games">
              {match.team_a_games} – {match.team_b_games}
            </div>
            <div className="control-scoreboard-sets">
              {Array.from({ length: matchSetsToWin }).map((_, i) => (
                <span
                  key={i}
                  className={`control-scoreboard-set-dot team-b ${i < setsWonB ? 'won' : ''}`}
                  aria-hidden
                />
              ))}
            </div>
          </div>
          {match.is_tiebreak && (
            <div className="control-scoreboard-tiebreak">Tiebreak</div>
          )}
          {pointSituation && (
            <div className="control-point-badge">{pointSituation.type}</div>
          )}
        </div>

        <div className="control-score-buttons">
          <button
            className={`control-score-button control-score-button-a ${actionLoading === 'score-a' ? 'loading' : ''}`}
            onClick={() => scorePoint('a')}
            disabled={!!actionLoading}
          >
            {actionLoading === 'score-a' ? '...' : `+ ${teamAName}`}
          </button>
          <button
            className={`control-score-button control-score-button-b ${actionLoading === 'score-b' ? 'loading' : ''}`}
            onClick={() => scorePoint('b')}
            disabled={!!actionLoading}
          >
            {actionLoading === 'score-b' ? '...' : `+ ${teamBName}`}
          </button>
        </div>

        <div className="control-actions">
          <button
            className="control-button"
            onClick={undoLastPoint}
            disabled={!!actionLoading}
          >
            {actionLoading === 'undo' ? 'Undoing...' : 'UNDO'}
          </button>
          <button
            className="control-button control-button-danger"
            onClick={() => setShowEndConfirm(true)}
            disabled={!!actionLoading}
          >
            END MATCH
          </button>
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
