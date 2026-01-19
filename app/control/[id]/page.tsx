'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, getCourtBySlug, validateControlPin } from '@/lib/supabase'
import ScoreDisplay from '@/components/ScoreDisplay'
import type { MatchState, GameMode } from '@/lib/types/match'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  // Form state for creating match
  const [gameMode, setGameMode] = useState<GameMode>('golden_point')
  const [setsToWin, setSetsToWin] = useState<1 | 2>(1)
  const [teamAPlayer1, setTeamAPlayer1] = useState('')
  const [teamAPlayer2, setTeamAPlayer2] = useState('')
  const [teamBPlayer1, setTeamBPlayer1] = useState('')
  const [teamBPlayer2, setTeamBPlayer2] = useState('')

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

        setMatch(data)
        setLoading(false)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Unexpected error occurred')
        setLoading(false)
      }
    }

    loadMatch()

    // Subscribe to real-time changes
    channel = supabase
      .channel(`control-${courtId}`)
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
          
          // Only update if match is still active
          if (updatedMatch.status === 'setup' || updatedMatch.status === 'in_progress') {
            setMatch(updatedMatch)
          } else {
            // Match completed or abandoned
            setMatch(null)
          }
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [courtId, pinAuthenticated])

  async function createMatch() {
    if (!courtId) return

    setActionLoading('create')
    setError(null)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          court_id: courtId,
          game_mode: gameMode,
          sets_to_win: setsToWin,
          team_a_player_1: teamAPlayer1 || undefined,
          team_a_player_2: teamAPlayer2 || undefined,
          team_b_player_1: teamBPlayer1 || undefined,
          team_b_player_2: teamBPlayer2 || undefined,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to create match')
        setActionLoading(null)
        return
      }

      // Match will be updated via real-time subscription
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

      // Match will be updated via real-time subscription (will become null)
      setActionLoading(null)
    } catch (err) {
      console.error('Error ending match:', err)
      setError('Failed to end match')
      setActionLoading(null)
    }
  }

  // PIN entry screen
  if (pinLoading || !pinAuthenticated) {
    return (
      <div className="control-panel">
        <div className="control-pin-container">
          <h1 className="control-pin-title">Control Panel</h1>
          <p className="control-pin-subtitle">Enter 4-digit PIN</p>
          
          {pinError && <div className="control-pin-error">{pinError}</div>}
          
          <div className="control-pin-input-container">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              className="control-pin-input"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                setPin(value)
                setPinError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pin.length === 4) {
                  handlePinSubmit()
                }
              }}
              placeholder="0000"
              autoFocus
              disabled={pinLoading}
            />
          </div>
          
          <button
            className="control-button control-button-primary"
            onClick={handlePinSubmit}
            disabled={pin.length !== 4 || pinLoading}
          >
            {pinLoading ? 'Verifying...' : 'Submit'}
          </button>
        </div>

        <style jsx>{`
          .control-panel {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .control-pin-container {
            max-width: 400px;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2rem;
          }
          .control-pin-title {
            font-size: 2rem;
            font-weight: bold;
            text-align: center;
          }
          .control-pin-subtitle {
            font-size: 1.2rem;
            opacity: 0.8;
            text-align: center;
          }
          .control-pin-error {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            padding: 1rem;
            border-radius: 0.5rem;
            text-align: center;
            width: 100%;
          }
          .control-pin-input-container {
            width: 100%;
          }
          .control-pin-input {
            width: 100%;
            padding: 1.5rem;
            font-size: 2rem;
            text-align: center;
            letter-spacing: 0.5rem;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.75rem;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            font-weight: bold;
          }
          .control-pin-input:focus {
            outline: none;
            border-color: #22c55e;
          }
          .control-pin-input:disabled {
            opacity: 0.5;
          }
          .control-button {
            min-height: 48px;
            padding: 0.75rem 2rem;
            font-size: 1.25rem;
            font-weight: 600;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
          }
          .control-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .control-button-primary {
            background: #22c55e;
            color: #fff;
          }
          .control-button-primary:not(:disabled):active {
            background: #16a34a;
            transform: scale(0.98);
          }
        `}</style>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="control-panel">
        <div className="control-loading">Loading...</div>
        <style jsx>{`
          .control-panel {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .control-loading {
            font-size: 1.5rem;
          }
        `}</style>
      </div>
    )
  }

  if (error && !match) {
    return (
      <div className="control-panel">
        <div className="control-error">{error}</div>
        <style jsx>{`
          .control-panel {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .control-error {
            font-size: 1.5rem;
            color: #ef4444;
          }
        `}</style>
      </div>
    )
  }

  // No active match - show create form
  if (!match) {
    return (
      <div className="control-panel">
        <div className="control-container">
          <h1 className="control-title">Create Match</h1>
          
          {error && <div className="control-error-message">{error}</div>}

          <div className="control-form">
            <div className="control-form-group">
              <label className="control-label">Game Mode</label>
              <select
                className="control-select"
                value={gameMode}
                onChange={(e) => {
                  const value = e.target.value as GameMode
                  setGameMode(value)
                }}
              >
                <option value="traditional">Traditional</option>
                <option value="golden_point">Golden Point</option>
                <option value="silver_point">Silver Point</option>
              </select>
            </div>

            <div className="control-form-group">
              <label className="control-label">Sets</label>
              <select
                className="control-select"
                value={setsToWin}
                onChange={(e) => setSetsToWin(Number(e.target.value) as 1 | 2)}
              >
                <option value={1}>1 Set</option>
                <option value={2}>Best of 3</option>
              </select>
            </div>

            <div className="control-form-group">
              <label className="control-label">Team A Player 1 (optional)</label>
              <input
                type="text"
                className="control-input"
                value={teamAPlayer1}
                onChange={(e) => setTeamAPlayer1(e.target.value)}
                placeholder="Player name"
              />
            </div>

            <div className="control-form-group">
              <label className="control-label">Team A Player 2 (optional)</label>
              <input
                type="text"
                className="control-input"
                value={teamAPlayer2}
                onChange={(e) => setTeamAPlayer2(e.target.value)}
                placeholder="Player name"
              />
            </div>

            <div className="control-form-group">
              <label className="control-label">Team B Player 1 (optional)</label>
              <input
                type="text"
                className="control-input"
                value={teamBPlayer1}
                onChange={(e) => setTeamBPlayer1(e.target.value)}
                placeholder="Player name"
              />
            </div>

            <div className="control-form-group">
              <label className="control-label">Team B Player 2 (optional)</label>
              <input
                type="text"
                className="control-input"
                value={teamBPlayer2}
                onChange={(e) => setTeamBPlayer2(e.target.value)}
                placeholder="Player name"
              />
            </div>

            <button
              className="control-button control-button-primary"
              onClick={createMatch}
              disabled={actionLoading === 'create'}
            >
              {actionLoading === 'create' ? 'Creating...' : 'Start Match'}
            </button>
          </div>
        </div>

        <style jsx>{`
          .control-panel {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            padding: 2rem 1rem;
          }
          .control-container {
            max-width: 600px;
            margin: 0 auto;
          }
          .control-title {
            font-size: 2rem;
            margin-bottom: 2rem;
            text-align: center;
          }
          .control-error-message {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          .control-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          .control-form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .control-label {
            font-size: 1rem;
            font-weight: 600;
            opacity: 0.9;
          }
          .control-select,
          .control-input {
            padding: 0.75rem;
            font-size: 1rem;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.5rem;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
          }
          .control-select:focus,
          .control-input:focus {
            outline: none;
            border-color: #22c55e;
          }
          .control-button {
            min-height: 48px;
            padding: 0.75rem 1.5rem;
            font-size: 1.25rem;
            font-weight: 600;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
          }
          .control-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .control-button-primary {
            background: #22c55e;
            color: #fff;
          }
          .control-button-primary:not(:disabled):active {
            background: #16a34a;
            transform: scale(0.98);
          }
        `}</style>
      </div>
    )
  }

  // Active match - show score and controls
  return (
    <div className="control-panel">
      <div className="control-container">
        {error && <div className="control-error-message">{error}</div>}

        {/* Score Display */}
        <div className="control-score-section">
          <ScoreDisplay match={match} variant="spectator" />
        </div>

        {/* Score Buttons */}
        <div className="control-score-buttons">
          <button
            className={`control-score-button control-score-button-a ${actionLoading === 'score-a' ? 'loading' : ''}`}
            onClick={() => scorePoint('a')}
            disabled={!!actionLoading}
          >
            {actionLoading === 'score-a' ? '...' : '+ Team A'}
          </button>
          <button
            className={`control-score-button control-score-button-b ${actionLoading === 'score-b' ? 'loading' : ''}`}
            onClick={() => scorePoint('b')}
            disabled={!!actionLoading}
          >
            {actionLoading === 'score-b' ? '...' : '+ Team B'}
          </button>
        </div>

        {/* Control Buttons */}
        <div className="control-actions">
          <button
            className="control-button control-button-secondary"
            onClick={undoLastPoint}
            disabled={!!actionLoading}
          >
            {actionLoading === 'undo' ? 'Undoing...' : 'Undo'}
          </button>
          <button
            className="control-button control-button-danger"
            onClick={() => setShowEndConfirm(true)}
            disabled={!!actionLoading}
          >
            End Match
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
              <button
                className="control-button control-button-secondary"
                onClick={() => setShowEndConfirm(false)}
              >
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

      <style jsx>{`
        .control-panel {
          min-height: 100vh;
          background: #1a1a2e;
          color: #fff;
          padding: 1rem;
        }
        .control-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .control-error-message {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .control-score-section {
          margin-bottom: 2rem;
        }
        .control-score-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .control-score-button {
          min-height: 80px;
          font-size: 1.5rem;
          font-weight: bold;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          color: #fff;
        }
        .control-score-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .control-score-button-a {
          background: #3b82f6;
        }
        .control-score-button-a:not(:disabled):active {
          background: #2563eb;
          transform: scale(0.98);
        }
        .control-score-button-b {
          background: #ef4444;
        }
        .control-score-button-b:not(:disabled):active {
          background: #dc2626;
          transform: scale(0.98);
        }
        .control-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .control-button {
          min-height: 48px;
          padding: 0.75rem 1.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .control-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .control-button-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
        .control-button-secondary:not(:disabled):active {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(0.98);
        }
        .control-button-danger {
          background: #ef4444;
          color: #fff;
        }
        .control-button-danger:not(:disabled):active {
          background: #dc2626;
          transform: scale(0.98);
        }
        .control-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 1000;
        }
        .control-modal {
          background: #1a1a2e;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          padding: 2rem;
          max-width: 400px;
          width: 100%;
        }
        .control-modal-title {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        .control-modal-text {
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }
        .control-modal-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 640px) {
          .control-score-buttons {
            gap: 0.75rem;
          }
          .control-score-button {
            min-height: 70px;
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  )
}
