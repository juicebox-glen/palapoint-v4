'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, getCourtBySlug, type Court } from '@/lib/supabase'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import ScoreDisplay from '@/components/ScoreDisplay'
import type { MatchState } from '@/lib/types/match'
import { formatPointDisplay, buildTeamName } from '@/lib/utils/score-format'
import { getPointSituation } from '@/lib/utils/point-situation'
import '@/app/styles/setup-form.css'
import '@/app/styles/control-panel.css'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

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
          if (payload.eventType === 'DELETE') {
            setMatch(null)
            return
          }

          const updatedMatch = payload.new as MatchState

          // Always update match state, even if completed or abandoned
          // This ensures we keep the match data when it transitions to completed/abandoned
          setMatch(updatedMatch)

          // If match just completed or abandoned, store settings for rematch
          if (updatedMatch.status === 'completed' || updatedMatch.status === 'abandoned') {
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
      .subscribe()

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
              {buildTeamName(previewA1, previewA2, 'Team A')} vs {buildTeamName(previewB1, previewB2, 'Team B')}
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
  if (match && (match.status === 'completed' || match.status === 'abandoned')) {
    const teamAName = buildTeamName(match.team_a_player_1, match.team_a_player_2, 'Team A')
    const teamBName = buildTeamName(match.team_b_player_1, match.team_b_player_2, 'Team B')
    const winnerName = match.winner === 'a' ? teamAName : teamBName

    return (
      <div className="playing-page">
        <div className="playing-container">
          <h1 className="playing-title">Match Complete!</h1>

          {error && <div className="playing-error-message">{error}</div>}

          <div className="playing-completed-score">
            <ScoreDisplay match={match} variant="spectator" />
            {getPointSituation(match) && (
              <div className="point-situation-badge-playing">
                {getPointSituation(match)?.type}
              </div>
            )}
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
          .point-situation-badge-playing {
            font-size: 1.25rem;
            font-weight: 600;
            color: #BDF33F;
            text-align: center;
            padding: 0.5rem 1rem;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 0.5rem;
            margin: 1rem 0;
            letter-spacing: 0.1em;
            text-transform: uppercase;
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

  // State 1: Match In Progress — same layout as staff controller (/control/[id])
  const teamAName = buildTeamName(match.team_a_player_1, match.team_a_player_2, 'Team A')
  const teamBName = buildTeamName(match.team_b_player_1, match.team_b_player_2, 'Team B')
  const pointsA = formatPointDisplay(
    match.team_a_points,
    match.team_b_points,
    match.is_tiebreak ?? false,
    match.is_tiebreak ? match.tiebreak_scores?.team_a : undefined
  )
  const pointsB = formatPointDisplay(
    match.team_b_points,
    match.team_a_points,
    match.is_tiebreak ?? false,
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
    <div className="control-panel control-panel--player">
      <div className="control-container">
        <SetupScreenHeader />
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

        <div className="control-actions control-actions--single">
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
            {error && <div className="control-error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
            <div className="control-modal-buttons">
              <button className="control-button" onClick={() => { setShowEndConfirm(false); setError(null) }}>
                Cancel
              </button>
              <button
                className="control-button control-button-danger"
                onClick={handleEndMatch}
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
