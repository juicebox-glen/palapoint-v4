'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCourtBySlug, type Court } from '@/lib/supabase'
import ScoreDisplay from '@/components/ScoreDisplay'
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

  // Form state
  const [gameMode, setGameMode] = useState<GameMode>('golden_point')
  const [setsToWin, setSetsToWin] = useState<1 | 2>(1)
  const [players, setPlayers] = useState<string[]>(['', '', '', ''])

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

  // Handle Next button - navigate to teams page
  function handleNext() {
    if (!courtId) return

    // Save to sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`setup_players_${courtId}`, JSON.stringify(players))
      sessionStorage.setItem(`setup_game_mode_${courtId}`, gameMode)
      sessionStorage.setItem(`setup_sets_${courtId}`, setsToWin.toString())
    }

    // Navigate to teams page
    router.push(`/teams/${courtIdentifier}`)
  }

  // Handle Start Game (no players)
  async function handleStartGameNoPlayers() {
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
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to create match')
        setActionLoading(null)
        return
      }

      // Redirect to playing page
      router.push(`/playing/${courtIdentifier}`)
    } catch (err) {
      console.error('Error creating match:', err)
      setError('Failed to create match')
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="setup-page">
        <div className="setup-loading">Loading...</div>
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

  // State 2: Setup form
  return (
    <div className="setup-page">
      <div className="setup-container">
        <h1 className="setup-title">
          {court ? `${court.name} Setup` : 'Match Setup'}
        </h1>

        {error && <div className="setup-error-message">{error}</div>}

        <div className="setup-form">
          {/* Game Mode Selector */}
          <div className="setup-section">
            <label className="setup-label">Game Mode</label>
            <div className="setup-button-group">
              <button
                className={`setup-mode-button ${gameMode === 'golden_point' ? 'active' : ''}`}
                onClick={() => setGameMode('golden_point')}
              >
                <div className="setup-mode-name">Golden Point</div>
                <div className="setup-mode-desc">Deuce = sudden death</div>
              </button>
              <button
                className={`setup-mode-button ${gameMode === 'silver_point' ? 'active' : ''}`}
                onClick={() => setGameMode('silver_point')}
              >
                <div className="setup-mode-name">Silver Point</div>
                <div className="setup-mode-desc">One advantage, then sudden death</div>
              </button>
              <button
                className={`setup-mode-button ${gameMode === 'traditional' ? 'active' : ''}`}
                onClick={() => setGameMode('traditional')}
              >
                <div className="setup-mode-name">Traditional</div>
                <div className="setup-mode-desc">Full advantage rules</div>
              </button>
            </div>
          </div>

          {/* Sets Selector */}
          <div className="setup-section">
            <label className="setup-label">Sets</label>
            <div className="setup-button-group">
              <button
                className={`setup-sets-button ${setsToWin === 1 ? 'active' : ''}`}
                onClick={() => setSetsToWin(1)}
              >
                1 Set
              </button>
              <button
                className={`setup-sets-button ${setsToWin === 2 ? 'active' : ''}`}
                onClick={() => setSetsToWin(2)}
              >
                Best of 3
              </button>
            </div>
          </div>

          {/* Player Names */}
          <div className="setup-section">
            <label className="setup-label">Players (optional)</label>
            <div className="setup-players-list">
              {players.map((player, index) => (
                <input
                  key={index}
                  type="text"
                  className="setup-input"
                  placeholder="Player name"
                  value={player}
                  onChange={(e) => handlePlayerChange(index, e.target.value)}
                />
              ))}
            </div>
          </div>

          {/* Dynamic CTA */}
          {(() => {
            const hasAnyNames = players.some((p) => p.trim() !== '')
            
            if (!hasAnyNames) {
              // No names - show "Start Game"
              return (
                <button
                  className="setup-button setup-button-primary setup-button-start"
                  onClick={handleStartGameNoPlayers}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'create' ? 'Starting...' : 'Start Game'}
                </button>
              )
            } else {
              // Has names - show "Next"
              return (
                <button
                  className="setup-button setup-button-primary setup-button-start"
                  onClick={handleNext}
                >
                  Next
                </button>
              )
            }
          })()}
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
        .setup-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
          .setup-section {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            transition: opacity 0.3s;
          }
          .setup-section.disabled {
            opacity: 0.6;
          }
        .setup-label {
          font-size: 1.2rem;
          font-weight: 600;
          opacity: 0.9;
        }
        .setup-button-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
          .setup-mode-button {
            padding: 1rem;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.5rem;
            background: rgba(255, 255, 255, 0.05);
            color: #fff;
            cursor: pointer;
            transition: all 0.2s;
            text-align: left;
          }
          .setup-mode-button.active {
            border-color: #22c55e;
            background: rgba(34, 197, 94, 0.2);
          }
          .setup-mode-button:not(:disabled):active {
            transform: scale(0.98);
          }
          .setup-mode-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        .setup-mode-name {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .setup-mode-desc {
          font-size: 0.9rem;
          opacity: 0.7;
        }
          .setup-sets-button {
            min-height: 48px;
            padding: 0.75rem 1.5rem;
            font-size: 1.1rem;
            font-weight: 600;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.5rem;
            background: rgba(255, 255, 255, 0.05);
            color: #fff;
            cursor: pointer;
            transition: all 0.2s;
          }
          .setup-sets-button.active {
            border-color: #22c55e;
            background: rgba(34, 197, 94, 0.2);
          }
          .setup-sets-button:not(:disabled):active {
            transform: scale(0.98);
          }
          .setup-sets-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .setup-players-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .setup-teams-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }
          .setup-back-link {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            text-decoration: underline;
            font-size: 0.9rem;
            cursor: pointer;
            padding: 0.25rem 0.5rem;
          }
          .setup-back-link:active {
            opacity: 0.8;
          }
          .setup-teams-swap {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            animation: fadeIn 0.3s ease-in;
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .setup-swap-teams {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .setup-swap-team {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            padding: 1rem;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 0.5rem;
            border: 2px solid rgba(59, 130, 246, 0.3);
          }
          .setup-swap-team:last-of-type {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.3);
          }
          .setup-swap-team-label {
            font-size: 1rem;
            font-weight: 600;
            opacity: 0.9;
          }
          .setup-swap-vs {
            text-align: center;
            font-size: 1.5rem;
            opacity: 0.5;
            margin: -0.5rem 0;
          }
          .setup-swap-player-wrapper {
            position: relative;
            cursor: pointer;
            transition: all 0.2s;
          }
          .setup-swap-player-wrapper.selected {
            border-radius: 0.5rem;
            padding: 2px;
            background: rgba(34, 197, 94, 0.3);
          }
          .setup-swap-input {
            min-height: 48px;
            padding: 0.75rem;
            font-size: 1.1rem;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.5rem;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            transition: all 0.2s;
            width: 100%;
          }
          .setup-swap-input:focus {
            outline: none;
            border-color: #22c55e;
          }
          .setup-swap-player-wrapper.selected .setup-swap-input {
            border-color: #22c55e;
            background: rgba(34, 197, 94, 0.2);
          }
          .setup-swap-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }
          .setup-swap-hint {
            text-align: center;
            font-size: 0.9rem;
            opacity: 0.7;
            padding: 0.5rem;
            background: rgba(34, 197, 94, 0.1);
            border-radius: 0.5rem;
          }
          .setup-edit-note {
            text-align: center;
            font-size: 0.85rem;
            opacity: 0.6;
            margin-top: 0.5rem;
          }
        .setup-input {
          min-height: 48px;
          padding: 0.75rem;
          font-size: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .setup-input:focus {
          outline: none;
          border-color: #22c55e;
        }
        .setup-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
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
        .setup-button-start {
          width: 100%;
          font-size: 1.25rem;
          margin-top: 1rem;
        }
        @media (max-width: 640px) {
          .setup-title {
            font-size: 1.75rem;
          }
          .setup-button-group {
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}
