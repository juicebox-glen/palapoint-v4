'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, getCourtBySlug, type Court } from '@/lib/supabase'
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

function buildTeamName(player1: string | null | undefined, player2: string | null | undefined): string {
  const names: string[] = []
  if (player1) names.push(player1)
  if (player2) names.push(player2)
  
  if (names.length === 0) return 'Team A'
  if (names.length === 1) return names[0]
  return `${names[0]} / ${names[1]}`
}

function formatGameMode(gameMode: string): string {
  return gameMode.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

export default function PlayingPage() {
  const params = useParams()
  const router = useRouter()
  const courtIdentifier = params.id as string

  const [court, setCourt] = useState<Court | null>(null)
  const [courtId, setCourtId] = useState<string | null>(null)
  const [match, setMatch] = useState<MatchState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showSwapUI, setShowSwapUI] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  // Store previous match settings for rematch
  const [previousSettings, setPreviousSettings] = useState<{
    game_mode: string
    sets_to_win: number
    team_a_player_1?: string | null
    team_a_player_2?: string | null
    team_b_player_1?: string | null
    team_b_player_2?: string | null
  } | null>(null)

  // Load court and match
  useEffect(() => {
    if (!courtIdentifier) return

    let channel: ReturnType<typeof supabase.channel> | null = null

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

        // Load match (including completed matches)
        const { data: matchData, error: matchError } = await supabase
          .from('live_matches')
          .select('*')
          .eq('court_id', courtData.id)
          .in('status', ['setup', 'in_progress', 'completed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (matchError) {
          console.error('Error loading match:', matchError)
          setLoading(false)
          return
        }

        if (matchData) {
          setMatch(matchData)
          // Store settings for rematch
          if (matchData.status === 'completed' || matchData.status === 'abandoned') {
            setPreviousSettings({
              game_mode: matchData.game_mode,
              sets_to_win: matchData.sets_to_win,
              team_a_player_1: matchData.team_a_player_1,
              team_a_player_2: matchData.team_a_player_2,
              team_b_player_1: matchData.team_b_player_1,
              team_b_player_2: matchData.team_b_player_2,
            })
          }
        }
        setLoading(false)
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load data')
        setLoading(false)
      }
    }

    loadData()
  }, [courtIdentifier])

  // Separate effect for real-time subscription
  useEffect(() => {
    if (!courtId) return

    let channel: ReturnType<typeof supabase.channel> | null = null

    // Subscribe to real-time updates
    channel = supabase
      .channel(`playing-${courtId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_matches',
          filter: `court_id=eq.${courtId}`,
        },
        (payload) => {
          console.log('Realtime update:', payload)
          console.log('Match status:', payload.new?.status)

          if (payload.eventType === 'DELETE') {
            setMatch(null)
            return
          }

          const updatedMatch = payload.new as MatchState
          console.log('Updated match status:', updatedMatch.status)
          console.log('Match data:', updatedMatch)

          // Always update match state, even if completed or abandoned
          // This ensures we keep the match data when it transitions to completed/abandoned
          setMatch(updatedMatch)

          // If match just completed or abandoned, store settings for rematch
          if (updatedMatch.status === 'completed' || updatedMatch.status === 'abandoned') {
            console.log('Match ended, storing settings for rematch')
            setPreviousSettings((prev) => {
              // Only set if not already set
              if (prev) return prev
              return {
                game_mode: updatedMatch.game_mode,
                sets_to_win: updatedMatch.sets_to_win,
                team_a_player_1: updatedMatch.team_a_player_1,
                team_a_player_2: updatedMatch.team_a_player_2,
                team_b_player_1: updatedMatch.team_b_player_1,
                team_b_player_2: updatedMatch.team_b_player_2,
              }
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [courtId])

  async function handleEndMatch() {
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
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to end match')
        setActionLoading(null)
        return
      }

      // Match will be updated via real-time subscription to show completed state
      setActionLoading(null)
    } catch (err) {
      console.error('Error ending match:', err)
      setError('Failed to end match')
      setActionLoading(null)
    }
  }

  async function handlePlayAgain() {
    if (!courtId || !previousSettings) return

    setActionLoading('play_again')
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
          game_mode: previousSettings.game_mode,
          sets_to_win: previousSettings.sets_to_win,
          team_a_player_1: previousSettings.team_a_player_1,
          team_a_player_2: previousSettings.team_a_player_2,
          team_b_player_1: previousSettings.team_b_player_1,
          team_b_player_2: previousSettings.team_b_player_2,
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
      setShowSwapUI(false)
    } catch (err) {
      console.error('Error creating match:', err)
      setError('Failed to create match')
      setActionLoading(null)
    }
  }

  async function handleSwapAndStart() {
    if (!courtId || !previousSettings) return

    setActionLoading('swap')
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
          game_mode: previousSettings.game_mode,
          sets_to_win: previousSettings.sets_to_win,
          team_a_player_1: previousSettings.team_a_player_1,
          team_a_player_2: previousSettings.team_a_player_2,
          team_b_player_1: previousSettings.team_b_player_1,
          team_b_player_2: previousSettings.team_b_player_2,
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
      setShowSwapUI(false)
      setSelectedPlayer(null)
    } catch (err) {
      console.error('Error creating match:', err)
      setError('Failed to create match')
      setActionLoading(null)
    }
  }

  function handlePlayerSelect(player: string) {
    if (!previousSettings) return

    if (!selectedPlayer) {
      setSelectedPlayer(player)
    } else if (selectedPlayer === player) {
      setSelectedPlayer(null)
    } else {
      // Two players selected - swap them
      const players = [
        previousSettings.team_a_player_1,
        previousSettings.team_a_player_2,
        previousSettings.team_b_player_1,
        previousSettings.team_b_player_2,
      ].filter(Boolean) as string[]

      const index1 = players.indexOf(selectedPlayer)
      const index2 = players.indexOf(player)

      if (index1 !== -1 && index2 !== -1) {
        // Swap the players
        const temp = players[index1]
        players[index1] = players[index2]
        players[index2] = temp

        // Update previous settings with swapped players
        setPreviousSettings({
          ...previousSettings,
          team_a_player_1: players[0] || null,
          team_a_player_2: players[1] || null,
          team_b_player_1: players[2] || null,
          team_b_player_2: players[3] || null,
        })

        setSelectedPlayer(null)
      }
    }
  }

  if (loading) {
    return (
      <div className="playing-page">
        <div className="playing-loading">Loading...</div>
        <style jsx>{`
          .playing-page {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .playing-loading {
            font-size: 1.5rem;
          }
        `}</style>
      </div>
    )
  }

  if (error && !match && !court) {
    return (
      <div className="playing-page">
        <div className="playing-error">{error}</div>
        <style jsx>{`
          .playing-page {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .playing-error {
            font-size: 1.5rem;
            color: #ef4444;
          }
        `}</style>
      </div>
    )
  }

  // State 4: No active match
  if (!match) {
    return (
      <div className="playing-page">
        <div className="playing-container">
          <h1 className="playing-title">No match on this court</h1>
          <button
            className="playing-button playing-button-primary"
            onClick={() => router.push(`/setup/${courtIdentifier}`)}
          >
            Start a new match
          </button>
        </div>

        <style jsx>{`
          .playing-page {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .playing-container {
            text-align: center;
            max-width: 400px;
          }
          .playing-title {
            font-size: 1.5rem;
            margin-bottom: 2rem;
          }
          .playing-button {
            min-height: 48px;
            padding: 0.75rem 2rem;
            font-size: 1.1rem;
            font-weight: 600;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
          }
          .playing-button-primary {
            background: #22c55e;
            color: #fff;
          }
          .playing-button-primary:active {
            background: #16a34a;
            transform: scale(0.98);
          }
        `}</style>
      </div>
    )
  }

  // State 3: Swap Partners UI
  if (showSwapUI && previousSettings) {
    const players = [
      { name: previousSettings.team_a_player_1, team: 'a', pos: 1 },
      { name: previousSettings.team_a_player_2, team: 'a', pos: 2 },
      { name: previousSettings.team_b_player_1, team: 'b', pos: 1 },
      { name: previousSettings.team_b_player_2, team: 'b', pos: 2 },
    ].filter((p) => p.name) as Array<{ name: string; team: 'a' | 'b'; pos: number }>

    // Calculate preview from current previousSettings (which gets updated on swap)
    const previewA1 = previousSettings.team_a_player_1
    const previewA2 = previousSettings.team_a_player_2
    const previewB1 = previousSettings.team_b_player_1
    const previewB2 = previousSettings.team_b_player_2

    return (
      <div className="playing-page">
        <div className="playing-container">
          <h1 className="playing-title">Swap Partners</h1>
          <p className="playing-subtitle">Tap two players to swap them</p>

          {error && <div className="playing-error-message">{error}</div>}

          <div className="playing-swap-teams">
            <div className="playing-swap-team">
              <div className="playing-swap-team-label">Team A</div>
              {players
                .filter((p) => p.team === 'a')
                .map((player) => (
                  <button
                    key={`a-${player.pos}`}
                    className={`playing-swap-player ${selectedPlayer === player.name ? 'selected' : ''}`}
                    onClick={() => handlePlayerSelect(player.name)}
                  >
                    {player.name}
                  </button>
                ))}
            </div>

            <div className="playing-swap-vs">vs</div>

            <div className="playing-swap-team">
              <div className="playing-swap-team-label">Team B</div>
              {players
                .filter((p) => p.team === 'b')
                .map((player) => (
                  <button
                    key={`b-${player.pos}`}
                    className={`playing-swap-player ${selectedPlayer === player.name ? 'selected' : ''}`}
                    onClick={() => handlePlayerSelect(player.name)}
                  >
                    {player.name}
                  </button>
                ))}
            </div>
          </div>

          <div className="playing-swap-preview">
            <div className="playing-swap-preview-label">New matchup:</div>
            <div className="playing-swap-preview-teams">
              {buildTeamName(previewA1, previewA2)} vs {buildTeamName(previewB1, previewB2)}
            </div>
            {selectedPlayer && (
              <div className="playing-swap-hint">Tap another player to swap</div>
            )}
          </div>

          <div className="playing-swap-actions">
            <button
              className="playing-button playing-button-primary"
              onClick={handleSwapAndStart}
              disabled={!!actionLoading}
            >
              {actionLoading === 'swap' ? 'Starting...' : 'Start Match'}
            </button>
            <button
              className="playing-button playing-button-secondary"
              onClick={() => {
                setShowSwapUI(false)
                setSelectedPlayer(null)
              }}
              disabled={!!actionLoading}
            >
              Cancel
            </button>
          </div>
        </div>

        <style jsx>{`
          .playing-page {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            padding: 2rem 1rem;
          }
          .playing-container {
            max-width: 500px;
            margin: 0 auto;
          }
          .playing-title {
            font-size: 2rem;
            margin-bottom: 0.5rem;
            text-align: center;
          }
          .playing-subtitle {
            text-align: center;
            opacity: 0.8;
            margin-bottom: 2rem;
          }
          .playing-error-message {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          .playing-swap-teams {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-bottom: 2rem;
          }
          .playing-swap-team {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            padding: 1rem;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 0.5rem;
            border: 2px solid rgba(59, 130, 246, 0.3);
          }
          .playing-swap-team:last-of-type {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.3);
          }
          .playing-swap-team-label {
            font-size: 1rem;
            font-weight: 600;
            opacity: 0.9;
          }
          .playing-swap-vs {
            text-align: center;
            font-size: 1.5rem;
            opacity: 0.5;
            margin: -0.5rem 0;
          }
          .playing-swap-player {
            min-height: 48px;
            padding: 0.75rem;
            font-size: 1.1rem;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.5rem;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            cursor: pointer;
            transition: all 0.2s;
          }
          .playing-swap-player.selected {
            border-color: #22c55e;
            background: rgba(34, 197, 94, 0.2);
          }
          .playing-swap-player:active {
            transform: scale(0.98);
          }
          .playing-swap-preview {
            background: rgba(255, 255, 255, 0.05);
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          .playing-swap-preview-label {
            font-size: 0.9rem;
            opacity: 0.7;
            margin-bottom: 0.5rem;
          }
          .playing-swap-preview-teams {
            font-size: 1.2rem;
            font-weight: 600;
          }
          .playing-swap-actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .playing-button {
            min-height: 48px;
            padding: 0.75rem 1.5rem;
            font-size: 1.1rem;
            font-weight: 600;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
          }
          .playing-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .playing-button-primary {
            background: #22c55e;
            color: #fff;
          }
          .playing-button-primary:not(:disabled):active {
            background: #16a34a;
            transform: scale(0.98);
          }
          .playing-button-secondary {
            background: rgba(255, 255, 255, 0.2);
            color: #fff;
          }
          .playing-button-secondary:not(:disabled):active {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0.98);
          }
        `}</style>
      </div>
    )
  }

  // State 2: Match Completed or Abandoned
  console.log('Current match status:', match?.status)
  if (match && (match.status === 'completed' || match.status === 'abandoned')) {
    const teamAName = buildTeamName(match.team_a_player_1, match.team_a_player_2)
    const teamBName = buildTeamName(match.team_b_player_1, match.team_b_player_2)
    const winnerName = match.winner === 'a' ? teamAName : teamBName

    return (
      <div className="playing-page">
        <div className="playing-container">
          <h1 className="playing-title">Match Complete!</h1>

          {error && <div className="playing-error-message">{error}</div>}

          <div className="playing-completed-score">
            <ScoreDisplay match={match} variant="spectator" />
          </div>

          <div className="playing-winner">
            <div className="playing-winner-label">Winner</div>
            <div className="playing-winner-name">{winnerName}</div>
          </div>

          <div className="playing-settings">
            {formatGameMode(match.game_mode)} · {match.sets_to_win === 1 ? '1 Set' : 'Best of 3'}
          </div>

          <div className="playing-actions">
            <button
              className="playing-button playing-button-primary playing-button-large"
              onClick={handlePlayAgain}
              disabled={!!actionLoading || !previousSettings}
            >
              {actionLoading === 'play_again' ? 'Starting...' : 'Play Again'}
            </button>
            <button
              className="playing-button playing-button-secondary"
              onClick={() => setShowSwapUI(true)}
              disabled={!!actionLoading || !previousSettings}
            >
              Swap Partners
            </button>
            <button
              className="playing-button playing-button-link"
              onClick={() => router.push(`/setup/${courtIdentifier}`)}
              disabled={!!actionLoading}
            >
              New Setup
            </button>
          </div>
        </div>

        <style jsx>{`
          .playing-page {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            padding: 2rem 1rem;
          }
          .playing-container {
            max-width: 500px;
            margin: 0 auto;
          }
          .playing-title {
            font-size: 2rem;
            margin-bottom: 2rem;
            text-align: center;
          }
          .playing-error-message {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          .playing-completed-score {
            margin-bottom: 2rem;
          }
          .playing-winner {
            text-align: center;
            margin-bottom: 1.5rem;
          }
          .playing-winner-label {
            font-size: 1rem;
            opacity: 0.7;
            margin-bottom: 0.5rem;
          }
          .playing-winner-name {
            font-size: 1.5rem;
            font-weight: bold;
            color: #22c55e;
          }
          .playing-settings {
            text-align: center;
            font-size: 1rem;
            opacity: 0.7;
            margin-bottom: 2rem;
          }
          .playing-actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .playing-button {
            min-height: 48px;
            padding: 0.75rem 1.5rem;
            font-size: 1.1rem;
            font-weight: 600;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
          }
          .playing-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .playing-button-primary {
            background: #22c55e;
            color: #fff;
          }
          .playing-button-primary:not(:disabled):active {
            background: #16a34a;
            transform: scale(0.98);
          }
          .playing-button-large {
            font-size: 1.25rem;
            padding: 1rem 1.5rem;
          }
          .playing-button-secondary {
            background: rgba(255, 255, 255, 0.2);
            color: #fff;
          }
          .playing-button-secondary:not(:disabled):active {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0.98);
          }
          .playing-button-link {
            background: transparent;
            color: rgba(255, 255, 255, 0.7);
            text-decoration: underline;
            padding: 0.5rem;
            min-height: auto;
          }
          .playing-button-link:not(:disabled):active {
            opacity: 0.8;
          }
        `}</style>
      </div>
    )
  }

  // State 1: Match In Progress
  const teamAName = buildTeamName(match.team_a_player_1, match.team_a_player_2)
  const teamBName = buildTeamName(match.team_b_player_1, match.team_b_player_2)

  return (
    <div className="playing-page">
      <div className="playing-container">
        <div className="playing-header">
          <h1 className="playing-court-name">{court?.name || 'Court'}</h1>
          <div className="playing-settings-small">
            {formatGameMode(match.game_mode)} · {match.sets_to_win === 1 ? '1 Set' : 'Best of 3'}
          </div>
        </div>

        <div className="playing-players">
          {teamAName} vs {teamBName}
        </div>

        <div className="playing-score">
          <ScoreDisplay match={match} variant="spectator" />
        </div>

        <div className="playing-end-link">
          <button
            className="playing-end-button"
            onClick={() => setShowEndConfirm(true)}
            disabled={!!actionLoading}
          >
            End Match
          </button>
        </div>
      </div>

      {/* End Match Confirmation Modal */}
      {showEndConfirm && (
        <div className="playing-modal-overlay" onClick={() => setShowEndConfirm(false)}>
          <div className="playing-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="playing-modal-title">End Match?</h2>
            <p className="playing-modal-text">Are you sure you want to end this match?</p>
            {error && <div className="playing-modal-error">{error}</div>}
            <div className="playing-modal-buttons">
              <button
                className="playing-button playing-button-secondary"
                onClick={() => {
                  setShowEndConfirm(false)
                  setError(null)
                }}
                disabled={actionLoading === 'end'}
              >
                Cancel
              </button>
              <button
                className="playing-button playing-button-primary"
                onClick={handleEndMatch}
                disabled={actionLoading === 'end'}
              >
                {actionLoading === 'end' ? 'Ending...' : 'End Match'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .playing-page {
          min-height: 100vh;
          background: #1a1a2e;
          color: #fff;
          padding: 1.5rem 1rem;
        }
        .playing-container {
          max-width: 500px;
          margin: 0 auto;
        }
        .playing-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .playing-court-name {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .playing-settings-small {
          font-size: 0.9rem;
          opacity: 0.7;
        }
        .playing-players {
          text-align: center;
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }
        .playing-score {
          margin-bottom: 2rem;
        }
        .playing-end-link {
          text-align: center;
        }
        .playing-end-button {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: underline;
          font-size: 0.9rem;
          cursor: pointer;
          padding: 0.5rem;
        }
        .playing-end-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .playing-end-button:not(:disabled):active {
          opacity: 0.8;
        }
        .playing-modal-overlay {
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
        .playing-modal {
          background: #1a1a2e;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          padding: 2rem;
          max-width: 400px;
          width: 100%;
        }
        .playing-modal-title {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        .playing-modal-text {
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }
        .playing-modal-error {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }
        .playing-modal-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
      `}</style>
    </div>
  )
}
