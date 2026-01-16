'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCourtBySlug, type Court } from '@/lib/supabase'
import ScoreDisplay from '@/components/ScoreDisplay'

interface MatchState {
  id: string
  court_id: string
  version: number
  game_mode: string
  sets_to_win: number
  tiebreak_at: number
  status: string
  current_set: number
  is_tiebreak: boolean
  team_a_points: number
  team_b_points: number
  team_a_games: number
  team_b_games: number
  set_scores: Array<{ team_a: number; team_b: number }>
  tiebreak_scores?: { team_a: number; team_b: number }
  tiebreak_starting_server?: string
  deuce_count: number
  serving_team: 'a' | 'b' | null
  team_a_player_1?: string | null
  team_a_player_2?: string | null
  team_b_player_1?: string | null
  team_b_player_2?: string | null
  winner: 'a' | 'b' | null
  started_at?: string | null
  completed_at?: string | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://heapuqojxnuejpveplvx.supabase.co'

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
  const [gameMode, setGameMode] = useState<'golden_point' | 'silver_point' | 'traditional'>('golden_point')
  const [setsToWin, setSetsToWin] = useState<1 | 2>(1)
  const [teamAPlayer1, setTeamAPlayer1] = useState('')
  const [teamAPlayer2, setTeamAPlayer2] = useState('')
  const [teamBPlayer1, setTeamBPlayer1] = useState('')
  const [teamBPlayer2, setTeamBPlayer2] = useState('')

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

  async function handleStartMatch() {
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

      // Redirect to court display
      router.push(`/court/${courtIdentifier}`)
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
              {formatTimeAgo(activeMatch.started_at)}
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
            <label className="setup-label">Player Names (optional)</label>
            
            <div className="setup-team-group">
              <div className="setup-team-label">Team A</div>
              <input
                type="text"
                className="setup-input"
                placeholder="Player 1 (optional)"
                value={teamAPlayer1}
                onChange={(e) => setTeamAPlayer1(e.target.value)}
              />
              <input
                type="text"
                className="setup-input"
                placeholder="Player 2 (optional)"
                value={teamAPlayer2}
                onChange={(e) => setTeamAPlayer2(e.target.value)}
              />
            </div>

            <div className="setup-team-group">
              <div className="setup-team-label">Team B</div>
              <input
                type="text"
                className="setup-input"
                placeholder="Player 1 (optional)"
                value={teamBPlayer1}
                onChange={(e) => setTeamBPlayer1(e.target.value)}
              />
              <input
                type="text"
                className="setup-input"
                placeholder="Player 2 (optional)"
                value={teamBPlayer2}
                onChange={(e) => setTeamBPlayer2(e.target.value)}
              />
            </div>
          </div>

          {/* Start Match Button */}
          <button
            className="setup-button setup-button-primary setup-button-start"
            onClick={handleStartMatch}
            disabled={!!actionLoading}
          >
            {actionLoading === 'create' ? 'Starting...' : 'Start Match'}
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
        .setup-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .setup-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
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
        .setup-mode-button:active {
          transform: scale(0.98);
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
        .setup-sets-button:active {
          transform: scale(0.98);
        }
        .setup-team-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 0.5rem;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .setup-team-group:last-of-type {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }
        .setup-team-label {
          font-size: 1rem;
          font-weight: 600;
          opacity: 0.9;
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
