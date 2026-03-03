'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, getCourtBySlug, validateControlPin } from '@/lib/supabase'
import MatchSetupForm from '@/components/MatchSetupForm'
import Header from '@/components/ui/Header'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import type { MatchState, GameMode } from '@/lib/types/match'
import { formatPointDisplay, buildTeamNameAbbreviated } from '@/lib/utils/score-format'
import { getPointSituation } from '@/lib/utils/point-situation'
import '@/app/styles/setup-form.css'
import '@/app/styles/control-panel.css'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export default function ControlPanelPage() {
  const params = useParams()
  const courtIdentifier = params.id as string
  const [courtId, setCourtId] = useState<string | null>(null)
  const [pinAuthenticated, setPinAuthenticated] = useState(false)
  const [pinLoading, setPinLoading] = useState(true)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [match, setMatch] = useState<MatchState | null>(null)
  const [completedMatch, setCompletedMatch] = useState<MatchState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  // Form state for creating match (same as player setup)
  const [gameMode, setGameMode] = useState<GameMode>('traditional')
  const [setsToWin, setSetsToWin] = useState<1 | 2>(1)
  const [sideSwapEnabled, setSideSwapEnabled] = useState(true)
  const [endGameInTiebreak, setEndGameInTiebreak] = useState(true)
  const [players, setPlayers] = useState<string[]>(['', '', '', ''])

  // Resolve court ID from slug or UUID
  useEffect(() => {
    if (!courtIdentifier) return

    async function resolveCourt() {
      try {
        const court = await getCourtBySlug(courtIdentifier)
        if (!court) {
          setError('Court not found')
          setPinLoading(false)
          setLoading(false)
          return
        }
        setCourtId(court.id)

        // Check if PIN is already authenticated in sessionStorage
        const storedPin = sessionStorage.getItem(`control_pin_${court.id}`)
        if (storedPin) {
          // Verify PIN is still valid
          const isValid = await validateControlPin(court.id, storedPin)
          if (isValid) {
            setPinAuthenticated(true)
            setPinLoading(false)
          } else {
            // PIN expired or invalid, clear it
            sessionStorage.removeItem(`control_pin_${court.id}`)
            setPinLoading(false)
          }
        } else {
          setPinLoading(false)
        }
      } catch (err) {
        console.error('Error resolving court:', err)
        setError('Failed to load court')
        setPinLoading(false)
        setLoading(false)
      }
    }

    resolveCourt()
  }, [courtIdentifier])

  // Handle PIN submission
  async function handlePinSubmit() {
    if (!courtId || pin.length !== 4) return

    setPinError(null)
    setPinLoading(true)

    try {
      const isValid = await validateControlPin(courtId, pin)
      if (isValid) {
        // Store PIN in sessionStorage
        sessionStorage.setItem(`control_pin_${courtId}`, pin)
        setPinAuthenticated(true)
        setPinLoading(false)
      } else {
        setPinError('Incorrect PIN')
        setPinLoading(false)
        setPin('')
      }
    } catch (err) {
      console.error('Error validating PIN:', err)
      setPinError('Failed to validate PIN')
      setPinLoading(false)
    }
  }

  useEffect(() => {
    if (!courtId || !pinAuthenticated) return

    let channel: ReturnType<typeof supabase.channel> | null = null

    // Initial load
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

        if (data) {
          setMatch(data)
          setCompletedMatch(null)
        } else {
          setMatch(null)
          // If no active match, check for recently completed (within 2 min) to show summary
          const { data: recent } = await supabase
            .from('live_matches')
            .select('*')
            .eq('court_id', courtId)
            .in('status', ['completed', 'abandoned'])
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (recent?.completed_at) {
            const completedAt = new Date(recent.completed_at).getTime()
            if (Date.now() - completedAt < 120_000) {
              setCompletedMatch(recent as MatchState)
            }
          }
        }
        setLoading(false)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Unexpected error occurred')
        setLoading(false)
      }
    }

    loadMatch()

    // Subscribe to real-time changes (clone payload so React sees a new reference)
    // Type assertion needed: Supabase RealtimeChannel has overload resolution issues with postgres_changes
    const ch = supabase.channel(`control-${courtId}`)
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
          return
        }
        const raw = payload.new ?? (payload as { data?: { new?: MatchState } }).data?.new
        if (!raw) return
        const updatedMatch = { ...raw } as MatchState
        if (updatedMatch.status === 'setup' || updatedMatch.status === 'in_progress') {
          setMatch(updatedMatch)
          setCompletedMatch(null)
        } else if (updatedMatch.status === 'completed' || updatedMatch.status === 'abandoned') {
          setMatch(null)
          setCompletedMatch(updatedMatch)
        }
      }
    )
    channel = ch.subscribe()

    // Refetch when tab becomes visible (fallback if realtime misses an event)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        supabase
          .from('live_matches')
          .select('*')
          .eq('court_id', courtId)
          .in('status', ['setup', 'in_progress'])
          .maybeSingle()
          .then(({ data }) => {
            if (data) setMatch({ ...data } as MatchState)
            else setMatch(null)
          })
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [courtId, pinAuthenticated])

  function handlePlayerChange(index: number, value: string) {
    const next = [...players]
    next[index] = value
    setPlayers(next)
  }

  function handleRandomize() {
    const copy = [...players]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    setPlayers(copy)
  }

  async function createMatch() {
    if (!courtId) return

    setActionLoading('create')
    setError(null)

    try {
      const body: Record<string, unknown> = {
        action: 'create',
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

      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to create match')
        setActionLoading(null)
        return
      }

      setActionLoading(null)
    } catch (err) {
      console.error('Error creating match:', err)
      setError('Failed to create match')
      setActionLoading(null)
    }
  }

  async function scorePoint(team: 'a' | 'b') {
    if (!courtId) return

    setActionLoading(`score-${team}`)
    setError(null)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          court_id: courtId,
          team: team,
          source: 'control_panel',
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to score point')
        setActionLoading(null)
        return
      }

      // Match will be updated via real-time subscription
      setActionLoading(null)
    } catch (err) {
      console.error('Error scoring point:', err)
      setError('Failed to score point')
      setActionLoading(null)
    }
  }

  async function undoLastPoint() {
    if (!courtId) return

    setActionLoading('undo')
    setError(null)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'undo',
          court_id: courtId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to undo')
        setActionLoading(null)
        return
      }

      // Match will be updated via real-time subscription
      setActionLoading(null)
    } catch (err) {
      console.error('Error undoing:', err)
      setError('Failed to undo')
      setActionLoading(null)
    }
  }

  async function endMatch() {
    if (!courtId) return

    setActionLoading('end')
    setError(null)
    setShowEndConfirm(false)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'end',
          court_id: courtId,
          reason: 'abandoned',
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to end match')
        setActionLoading(null)
        return
      }

      // Match will be updated via real-time subscription (will show summary)
      setActionLoading(null)
    } catch (err) {
      console.error('Error ending match:', err)
      setError('Failed to end match')
      setActionLoading(null)
    }
  }

  async function handlePlayAgain() {
    if (!courtId || !completedMatch) return

    setActionLoading('play_again')
    setError(null)

    try {
      const body: Record<string, unknown> = {
        action: 'create',
        court_id: courtId,
        game_mode: completedMatch.game_mode,
        sets_to_win: completedMatch.sets_to_win ?? 1,
        side_swap_enabled: completedMatch.side_swap_enabled ?? true,
        tiebreak_at: completedMatch.tiebreak_at ?? 6,
      }
      if (completedMatch.team_a_player_1) body.team_a_player_1 = completedMatch.team_a_player_1
      if (completedMatch.team_a_player_2) body.team_a_player_2 = completedMatch.team_a_player_2
      if (completedMatch.team_b_player_1) body.team_b_player_1 = completedMatch.team_b_player_1
      if (completedMatch.team_b_player_2) body.team_b_player_2 = completedMatch.team_b_player_2

      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to start match')
        setActionLoading(null)
        return
      }

      setCompletedMatch(null)
      setActionLoading(null)
    } catch (err) {
      console.error('Error starting match:', err)
      setError('Failed to start match')
      setActionLoading(null)
    }
  }

  function handleNewGame() {
    if (!completedMatch) return

    setPlayers([
      completedMatch.team_a_player_1 ?? '',
      completedMatch.team_a_player_2 ?? '',
      completedMatch.team_b_player_1 ?? '',
      completedMatch.team_b_player_2 ?? '',
    ])
    setGameMode(completedMatch.game_mode ?? 'traditional')
    setSetsToWin((completedMatch.sets_to_win ?? 1) as 1 | 2)
    setSideSwapEnabled(completedMatch.side_swap_enabled ?? true)
    setEndGameInTiebreak((completedMatch.tiebreak_at ?? 6) === 6)
    setCompletedMatch(null)
    setError(null)
  }

  // PIN entry screen (same design language as setup)
  if (pinLoading || !pinAuthenticated) {
    return (
      <div className="setup-screen">
        <div className="setup-pin-wrap">
          <SetupScreenHeader />
          <p className="setup-pin-title">Enter 4-digit PIN</p>
          {pinError && <div className="setup-pin-error">{pinError}</div>}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            className="setup-pin-input"
            value={pin}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 4)
              setPin(value)
              setPinError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pin.length === 4) handlePinSubmit()
            }}
            placeholder="0000"
            autoFocus
            disabled={pinLoading}
          />
          <button
            type="button"
            className="setup-pin-btn"
            onClick={handlePinSubmit}
            disabled={pin.length !== 4 || pinLoading}
          >
            {pinLoading ? 'Verifying...' : 'Submit'}
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <Header />
        <div
          className="page-loading"
          style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}
        >
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !match) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <Header />
        <div
          className="page-loading"
          style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}
        >
          <p style={{ fontSize: '1.5rem', color: 'var(--color-error)' }}>{error}</p>
        </div>
      </div>
    )
  }

  // Match complete — same design as player game ended, with control-specific options
  if (completedMatch) {
    const teamAName = buildTeamNameAbbreviated(
      completedMatch.team_a_player_1,
      completedMatch.team_a_player_2,
      'Team A'
    )
    const teamBName = buildTeamNameAbbreviated(
      completedMatch.team_b_player_1,
      completedMatch.team_b_player_2,
      'Team B'
    )
    const winnerName =
      completedMatch.winner === 'a'
        ? teamAName
        : completedMatch.winner === 'b'
          ? teamBName
          : null
    const isAbandoned = completedMatch.status === 'abandoned'
    const hasWinner = completedMatch.winner && !isAbandoned
    const finalScore =
      completedMatch.set_scores && completedMatch.set_scores.length > 0
        ? completedMatch.set_scores
            .map(
              (s: { team_a?: number; team_b?: number; team_a_games?: number; team_b_games?: number }) =>
                `${s.team_a_games ?? s.team_a ?? 0}-${s.team_b_games ?? s.team_b ?? 0}`
            )
            .join(', ')
        : `${completedMatch.team_a_games}-${completedMatch.team_b_games}`
    const winnerTeam = completedMatch.winner === 'a' ? 'team-a' : 'team-b'

    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <Header
          status="finished"
          statusText={isAbandoned ? 'MATCH ENDED' : 'MATCH COMPLETE'}
          courtName={courtIdentifier}
        />
        <div style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
          {error && <div className="control-error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
          <div
            className={`card-result ${hasWinner ? `${winnerTeam}-winner` : ''}`}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              ...(hasWinner && {
                borderTop: `3px solid var(--${winnerTeam})`,
              }),
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
          <button
            className="btn btn-primary btn-block"
            onClick={handlePlayAgain}
            disabled={!!actionLoading}
          >
            {actionLoading === 'play_again' ? 'Starting...' : 'Play Again'}
          </button>
          <button
            className="btn btn-secondary btn-block"
            onClick={handleNewGame}
            disabled={!!actionLoading}
          >
            New Game
          </button>
        </div>
      </div>
    )
  }

  // No active match - show same setup form as player setup
  if (!match) {
    return (
      <MatchSetupForm
        gameMode={gameMode}
        setGameMode={setGameMode}
        setsToWin={setsToWin}
        setSetsToWin={setSetsToWin}
        players={players}
        onPlayerChange={handlePlayerChange}
        onRandomize={handleRandomize}
        sideSwapEnabled={sideSwapEnabled}
        setSideSwapEnabled={setSideSwapEnabled}
        endGameInTiebreak={endGameInTiebreak}
        setEndGameInTiebreak={setEndGameInTiebreak}
        onSubmit={createMatch}
        submitLoading={actionLoading === 'create'}
        submitLabel="START GAME"
        error={error}
        showHeader
      />
    )
  }

  // Active match — header (LIVE + game mode), scoreboard card, + Point buttons, UNDO / END MATCH
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
        <SetupScreenHeader />
        {/* Header: LIVE (pulse) + Game mode */}
        <header className="control-header">
          <span className="control-live">
            <span className="control-live-dot" aria-hidden />
            LIVE
          </span>
          <span className="control-game-mode">{gameModeLabel}</span>
        </header>

        {error && <div className="control-error-message">{error}</div>}

        {/* Scoreboard card — design: horizontal server line above serving team, points, set dots, games in line */}
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

        {/* + Point buttons (team colors, thumb zone) */}
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

        {/* UNDO / END MATCH */}
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

      {/* End Match Confirmation */}
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
