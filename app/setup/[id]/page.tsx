'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCourtBySlug, type Court } from '@/lib/supabase'
import { checkSession, createSession, takeoverSession } from '@/lib/api/session'
import ScoreDisplay from '@/components/ScoreDisplay'
import MatchSetupForm from '@/components/MatchSetupForm'
import SessionProtectionPrompt from '@/components/SessionProtectionPrompt'
import type { MatchState, GameMode } from '@/lib/types/match'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Unknown'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just started'
  if (diffMins === 1) return 'Started 1 minute ago'
  if (diffMins < 60) return `Started ${diffMins} minutes ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours === 1) return 'Started 1 hour ago'
  if (diffHours < 24) return `Started ${diffHours} hours ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `Started ${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export default function SetupPage() {
  const params = useParams()
  const router = useRouter()
  const courtIdentifier = params.id as string
  
  const [court, setCourt] = useState<Court | null>(null)
  const [courtId, setCourtId] = useState<string | null>(null)
  const [activeMatch, setActiveMatch] = useState<MatchState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showSetupForm, setShowSetupForm] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<{
    minutes_active?: number
    minutes_since_activity?: number
    games_count?: number
  } | null>(null)
  const [showProtectionPrompt, setShowProtectionPrompt] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Form state
  const [gameMode, setGameMode] = useState<GameMode>('traditional')
  const [setsToWin, setSetsToWin] = useState<1 | 2>(1)
  const [players, setPlayers] = useState<string[]>(['', '', '', ''])
  const [sideSwapEnabled, setSideSwapEnabled] = useState(true)
  const [endGameInTiebreak, setEndGameInTiebreak] = useState(true)

  // Load court and check for active match
  useEffect(() => {
    if (!courtIdentifier) return

    async function loadData() {
      try {
        // Resolve court
        const courtData = await getCourtBySlug(courtIdentifier)
        if (!courtData) {
          setError('Court not found')
          setLoading(false)
          return
        }
        setCourt(courtData)
        setCourtId(courtData.id)

        // Check for existing session
        try {
          const sessionResult = await checkSession(courtData.id)

          if (sessionResult.has_active_session && sessionResult.session) {
            setActiveSession(sessionResult.session)
            setShowProtectionPrompt(true)
          } else {
            // No active session - create one
            const createResult = await createSession(courtData.id)
            if (createResult.success && createResult.session) {
              setCurrentSessionId(createResult.session.id)
              if (typeof window !== 'undefined') {
                sessionStorage.setItem(
                  `setup_session_id_${courtData.id}`,
                  createResult.session.id
                )
              }
            }
          }
        } catch (sessionErr) {
          console.error('Error checking session:', sessionErr)
        } finally {
          setSessionLoading(false)
        }

        // Check for active match
        const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'status',
            court_id: courtData.id,
          }),
        })

        const data = await response.json()

        if (data.success && data.match) {
          setActiveMatch(data.match)
        } else {
          setShowSetupForm(true)
          
          // Load saved data from sessionStorage if returning from teams page
          if (typeof window !== 'undefined') {
            const savedPlayers = sessionStorage.getItem(`setup_players_${courtData.id}`)
            const savedGameMode = sessionStorage.getItem(`setup_game_mode_${courtData.id}`)
            const savedSets = sessionStorage.getItem(`setup_sets_${courtData.id}`)
            
            if (savedPlayers) {
              try {
                const parsed = JSON.parse(savedPlayers)
                if (Array.isArray(parsed) && parsed.length === 4) {
                  setPlayers(parsed)
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
            
            if (savedGameMode) {
              const value = savedGameMode as GameMode
              if (['golden_point', 'silver_point', 'traditional'].includes(value)) {
                setGameMode(value)
              }
            }
            
            if (savedSets) {
              setSetsToWin(Number(savedSets) as 1 | 2)
            }
            
            const savedSideSwap = sessionStorage.getItem(`setup_side_swap_${courtData.id}`)
            if (savedSideSwap) {
              setSideSwapEnabled(JSON.parse(savedSideSwap))
            }
            const savedTiebreak = sessionStorage.getItem(`setup_tiebreak_${courtData.id}`)
            if (savedTiebreak !== null) {
              setEndGameInTiebreak(JSON.parse(savedTiebreak))
            }
          }
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load court data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courtIdentifier])

  const handleCancelSetup = () => {
    window.history.back()
  }

  const handleTakeover = async () => {
    if (!courtId) return

    setActionLoading('takeover')
    setError(null)

    try {
      const result = await takeoverSession(courtId)
      if (result.success && result.session) {
        setCurrentSessionId(result.session.id)
        setShowProtectionPrompt(false)
        setActiveSession(null)
        setActiveMatch(null)
        setShowSetupForm(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`setup_session_id_${courtId}`, result.session.id)
        }
      } else {
        setError(result.error || 'Failed to take over')
      }
    } catch (err) {
      console.error('Error taking over session:', err)
      setError('Failed to take over session')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleEndMatch() {
    if (!courtId) return

    setActionLoading('end')
    setError(null)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'end',
          court_id: courtId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to end match')
        setActionLoading(null)
        return
      }

      // Clear active match and show setup form
      setActiveMatch(null)
      setShowSetupForm(true)
      setActionLoading(null)
    } catch (err) {
      console.error('Error ending match:', err)
      setError('Failed to end match')
      setActionLoading(null)
    }
  }

  // Handle player name changes
  function handlePlayerChange(index: number, value: string) {
    const newPlayers = [...players]
    newPlayers[index] = value
    setPlayers(newPlayers)
  }

  // Randomize: shuffle the four player names and reassign to slots
  function handleRandomize() {
    const copy = [...players]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]]
    }
    setPlayers(copy)
  }

  // Handle Start Game - create match and go to playing
  async function handleStartGame() {
    if (!courtId) return

    setActionLoading('create')
    setError(null)

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`setup_players_${courtId}`, JSON.stringify(players))
      sessionStorage.setItem(`setup_game_mode_${courtId}`, gameMode)
      sessionStorage.setItem(`setup_sets_${courtId}`, setsToWin.toString())
      sessionStorage.setItem(`setup_side_swap_${courtId}`, JSON.stringify(sideSwapEnabled))
      sessionStorage.setItem(`setup_tiebreak_${courtId}`, JSON.stringify(endGameInTiebreak))
      sessionStorage.setItem(`setup_session_id_${courtId}`, currentSessionId || '')
    }

    try {
      const body: Record<string, unknown> = {
        action: 'create',
        court_id: courtId,
        session_id: currentSessionId || undefined,
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

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`setup_players_${courtId}`)
        sessionStorage.removeItem(`setup_game_mode_${courtId}`)
        sessionStorage.removeItem(`setup_sets_${courtId}`)
        sessionStorage.removeItem(`setup_side_swap_${courtId}`)
        sessionStorage.removeItem(`setup_tiebreak_${courtId}`)
        sessionStorage.removeItem(`setup_session_id_${courtId}`)
      }

      router.push(`/playing/${courtIdentifier}`)
    } catch (err) {
      console.error('Error creating match:', err)
      setError('Failed to create match')
      setActionLoading(null)
    }
  }

  if (loading || sessionLoading) {
    return (
      <div className="setup-page">
        <div className="setup-loading">
          {sessionLoading ? 'Checking court availability...' : 'Loading...'}
        </div>
        <style jsx>{`
          .setup-page {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .setup-loading {
            font-size: 1.5rem;
          }
        `}</style>
      </div>
    )
  }

  if (showProtectionPrompt && activeSession) {
    return (
      <SessionProtectionPrompt
        minutesActive={activeSession.minutes_active ?? 0}
        minutesSinceActivity={activeSession.minutes_since_activity ?? 0}
        gamesCount={activeSession.games_count ?? 0}
        onCancel={handleCancelSetup}
        onTakeover={handleTakeover}
      />
    )
  }

  if (error && !court) {
    return (
      <div className="setup-page">
        <div className="setup-error">{error}</div>
        <style jsx>{`
          .setup-page {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .setup-error {
            font-size: 1.5rem;
            color: #ef4444;
          }
        `}</style>
      </div>
    )
  }

  // State 1: Active match exists
  if (activeMatch && !showSetupForm) {
    return (
      <div className="setup-page">
        <div className="setup-container">
          <h1 className="setup-title">Match in Progress</h1>
          
          {error && <div className="setup-error-message">{error}</div>}

          <div className="setup-match-info">
            <div className="setup-match-time">
              {formatTimeAgo(activeMatch.started_at ?? null)}
            </div>
            
            <div className="setup-match-score">
              <ScoreDisplay match={activeMatch} variant="spectator" />
            </div>
          </div>

          <div className="setup-actions">
            <button
              className="setup-button setup-button-primary"
              onClick={handleEndMatch}
              disabled={!!actionLoading}
            >
              {actionLoading === 'end' ? 'Ending...' : 'End & Start New'}
            </button>
            <button
              className="setup-button setup-button-secondary"
              onClick={() => router.push(`/court/${courtIdentifier}`)}
              disabled={!!actionLoading}
            >
              View Match
            </button>
          </div>
        </div>

        <style jsx>{`
          .setup-page {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            padding: 2rem 1rem;
          }
          .setup-container {
            max-width: 600px;
            margin: 0 auto;
          }
          .setup-title {
            font-size: 2rem;
            margin-bottom: 2rem;
            text-align: center;
          }
          .setup-error-message {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          .setup-match-info {
            margin-bottom: 2rem;
          }
          .setup-match-time {
            text-align: center;
            font-size: 1.2rem;
            opacity: 0.8;
            margin-bottom: 1.5rem;
          }
          .setup-match-score {
            margin-bottom: 2rem;
          }
          .setup-actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .setup-button {
            min-height: 48px;
            padding: 0.75rem 1.5rem;
            font-size: 1.1rem;
            font-weight: 600;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
          }
          .setup-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .setup-button-primary {
            background: #22c55e;
            color: #fff;
          }
          .setup-button-primary:not(:disabled):active {
            background: #16a34a;
            transform: scale(0.98);
          }
          .setup-button-primary:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }
          .setup-button-secondary {
            background: rgba(255, 255, 255, 0.2);
            color: #fff;
          }
          .setup-button-secondary:not(:disabled):active {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0.98);
          }
        `}</style>
      </div>
    )
  }

  // State 2: Setup form (same design as staff setup)
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
      onSubmit={handleStartGame}
      submitLoading={actionLoading === 'create'}
      submitLabel="START GAME"
      error={error}
      showHeader
    />
  )
}
