'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkSession, createSession, takeoverSession, validateSession } from '@/lib/api/session'
import ScoreDisplay from '@/components/ScoreDisplay'
import Header from '@/components/ui/Header'
import MatchSetupForm from '@/components/MatchSetupForm'
import SessionProtectionPrompt from '@/components/SessionProtectionPrompt'
import { EMPTY_PLAYER_PHOTOS, type GameMode, type MatchState, type PlayerPhotosState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'

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

interface SetupDisplayProps {
  courtId: string
  courtSlug: string
  branding?: VenueBranding | null
}

export default function SetupDisplay({
  courtId,
  courtSlug,
  branding,
}: SetupDisplayProps) {
  const router = useRouter()
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

  const [gameMode, setGameMode] = useState<GameMode>('traditional')
  const [setsToWin, setSetsToWin] = useState<1 | 2>(1)
  const [players, setPlayers] = useState<string[]>(['', '', '', ''])
  const [sideSwapEnabled, setSideSwapEnabled] = useState(true)
  const [endGameInTiebreak, setEndGameInTiebreak] = useState(true)
  const [tempMatchId] = useState(() => crypto.randomUUID())
  const [playerPhotos, setPlayerPhotos] = useState<PlayerPhotosState>(EMPTY_PLAYER_PHOTOS)

  const handlePlayerPhotoChange = useCallback(
    (key: keyof PlayerPhotosState, url: string | null) => {
      setPlayerPhotos((prev) => ({ ...prev, [key]: url }))
    },
    []
  )

  useEffect(() => {
    async function loadData() {
      try {
        const storageKey = `setup_session_id_${courtSlug}`

        let hasValidStoredSession = false
        if (typeof window !== 'undefined') {
          const existingSessionId = sessionStorage.getItem(storageKey)
          if (existingSessionId) {
            const validation = await validateSession(existingSessionId)
            if (validation.valid) {
              setCurrentSessionId(existingSessionId)
              hasValidStoredSession = true
            } else {
              sessionStorage.removeItem(storageKey)
            }
          }
        }

        if (!hasValidStoredSession) {
          const result = await checkSession(courtId)
          if (result.has_active_session && result.session) {
            setActiveSession(result.session)
            setShowProtectionPrompt(true)
          } else {
            const createResult = await createSession(courtId)
            if (createResult.success && createResult.session) {
              setCurrentSessionId(createResult.session.id)
              if (typeof window !== 'undefined') {
                sessionStorage.setItem(storageKey, createResult.session.id)
              }
            }
          }
        }
      } catch (sessionErr) {
        console.error('Error checking session:', sessionErr)
      } finally {
        setSessionLoading(false)
      }

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', court_id: courtId }),
        })
        const data = await response.json()
        if (data.success && data.match) {
          setActiveMatch(data.match)
        } else {
          setShowSetupForm(true)
          if (typeof window !== 'undefined') {
            const savedPlayers = sessionStorage.getItem(`setup_players_${courtId}`)
            const savedGameMode = sessionStorage.getItem(`setup_game_mode_${courtId}`)
            const savedSets = sessionStorage.getItem(`setup_sets_${courtId}`)
            const savedSideSwap = sessionStorage.getItem(`setup_side_swap_${courtId}`)
            const savedTiebreak = sessionStorage.getItem(`setup_tiebreak_${courtId}`)
            const savedPhotos = sessionStorage.getItem(`setup_photos_${courtId}`)
            if (savedPlayers) {
              try {
                const parsed = JSON.parse(savedPlayers)
                if (Array.isArray(parsed) && parsed.length === 4) setPlayers(parsed)
              } catch {}
            }
            if (savedPhotos) {
              try {
                const parsed = JSON.parse(savedPhotos) as Partial<PlayerPhotosState>
                if (parsed && typeof parsed === 'object') {
                  setPlayerPhotos({ ...EMPTY_PLAYER_PHOTOS, ...parsed })
                }
              } catch {}
            }
            if (savedGameMode && ['golden_point', 'silver_point', 'traditional'].includes(savedGameMode)) {
              setGameMode(savedGameMode as GameMode)
            }
            if (savedSets) setSetsToWin(Number(savedSets) as 1 | 2)
            if (savedSideSwap) setSideSwapEnabled(JSON.parse(savedSideSwap))
            if (savedTiebreak !== null) setEndGameInTiebreak(JSON.parse(savedTiebreak))
          }
        }
      } catch (err) {
        console.error('Error loading match:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courtId, courtSlug])

  const handleCancelSetup = () => window.history.back()

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
          sessionStorage.setItem(`setup_session_id_${courtSlug}`, result.session.id)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', court_id: courtId }),
      })
      const data = await response.json()
      if (!data.success) {
        setError(data.error || 'Failed to end match')
      } else {
        setActiveMatch(null)
        setShowSetupForm(true)
      }
    } catch (err) {
      console.error('Error ending match:', err)
      setError('Failed to end match')
    } finally {
      setActionLoading(null)
    }
  }

  function handlePlayerChange(index: number, value: string) {
    const newPlayers = [...players]
    newPlayers[index] = value
    setPlayers(newPlayers)
  }

  function handleRandomize() {
    const copy = [...players]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    setPlayers(copy)
  }

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
      sessionStorage.setItem(`setup_photos_${courtId}`, JSON.stringify(playerPhotos))
      sessionStorage.setItem(`setup_session_id_${courtSlug}`, currentSessionId || '')
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
      body.team_a_player_1_photo = playerPhotos.team_a_player_1_photo
      body.team_a_player_2_photo = playerPhotos.team_a_player_2_photo
      body.team_b_player_1_photo = playerPhotos.team_b_player_1_photo
      body.team_b_player_2_photo = playerPhotos.team_b_player_2_photo

      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!data.success) {
        setError(data.error || 'Failed to create match')
      } else {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(`setup_players_${courtId}`)
          sessionStorage.removeItem(`setup_game_mode_${courtId}`)
          sessionStorage.removeItem(`setup_sets_${courtId}`)
          sessionStorage.removeItem(`setup_side_swap_${courtId}`)
          sessionStorage.removeItem(`setup_tiebreak_${courtId}`)
          sessionStorage.removeItem(`setup_photos_${courtId}`)
        }
        router.push(`/playing/${courtSlug}`)
      }
    } catch (err) {
      console.error('Error creating match:', err)
      setError('Failed to create match')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading || sessionLoading) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <Header branding={branding} />
        <div className="page-loading" style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
          <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>
            {sessionLoading ? 'Checking court availability...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (showProtectionPrompt && activeSession) {
    return (
      <SessionProtectionPrompt
        onCancel={handleCancelSetup}
        onTakeover={handleTakeover}
      />
    )
  }

  if (error && !activeMatch && !showSetupForm) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <Header branding={branding} />
        <div className="page-loading" style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
          <p style={{ fontSize: '1.5rem', color: 'var(--color-error)' }}>{error}</p>
        </div>
      </div>
    )
  }

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
              onClick={() => router.push(`/court/${courtSlug}`)}
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
            color: #E6EAF2;
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
            color: #E6EAF2;
          }
          .setup-match-score * {
            color: #E6EAF2;
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
            color: #E6EAF2;
          }
          .setup-button-primary:not(:disabled):active {
            background: #16a34a;
            transform: scale(0.98);
          }
          .setup-button-secondary {
            background: rgba(255, 255, 255, 0.2);
            color: #E6EAF2;
          }
          .setup-button-secondary:not(:disabled):active {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0.98);
          }
        `}</style>
      </div>
    )
  }

  return (
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
      onSubmit={handleStartGame}
      submitLoading={actionLoading === 'create'}
      submitLabel="START GAME"
      error={error}
      showHeader
      branding={branding}
    />
  )
}
