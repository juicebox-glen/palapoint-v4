'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCourtBySlug, type Court } from '@/lib/supabase'
import type { GameMode } from '@/lib/types/match'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

interface TeamAssignments {
  teamA: (string | null)[]
  teamB: (string | null)[]
}

export default function TeamsPage() {
  const params = useParams()
  const router = useRouter()
  const courtIdentifier = params.id as string

  const [court, setCourt] = useState<Court | null>(null)
  const [courtId, setCourtId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [editingPlayer, setEditingPlayer] = useState<{ team: 'a' | 'b'; index: number } | null>(null)

  const [players, setPlayers] = useState<string[]>(['', '', '', ''])
  const [gameMode, setGameMode] = useState<GameMode>('golden_point')
  const [setsToWin, setSetsToWin] = useState<1 | 2>(1)
  const [teams, setTeams] = useState<TeamAssignments | null>(null)

  // Load data from sessionStorage and assign teams
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

        // Load from sessionStorage
        if (typeof window !== 'undefined') {
          const savedPlayers = sessionStorage.getItem(`setup_players_${courtData.id}`)
          const savedGameMode = sessionStorage.getItem(`setup_game_mode_${courtData.id}`)
          const savedSets = sessionStorage.getItem(`setup_sets_${courtData.id}`)
          const savedTeams = sessionStorage.getItem(`setup_teams_${courtData.id}`)

          let loadedPlayers = ['', '', '', '']
          if (savedPlayers) {
            try {
              const parsed = JSON.parse(savedPlayers)
              if (Array.isArray(parsed) && parsed.length === 4) {
                loadedPlayers = parsed
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
          const sideSwapEnabled = savedSideSwap ? JSON.parse(savedSideSwap) : true

          // If teams already exist, use them; otherwise assign randomly
          if (savedTeams) {
            try {
              const parsed = JSON.parse(savedTeams)
              setTeams(parsed)
            } catch (e) {
              // Parse error, assign randomly
              assignTeamsRandomly(loadedPlayers, courtData.id)
            }
          } else {
            assignTeamsRandomly(loadedPlayers, courtData.id)
          }
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    function assignTeamsRandomly(playerList: string[], id: string) {
      const shuffled = [...playerList].sort(() => Math.random() - 0.5)
      
      const newTeams: TeamAssignments = {
        teamA: [shuffled[0] || null, shuffled[1] || null],
        teamB: [shuffled[2] || null, shuffled[3] || null],
      }
      
      setTeams(newTeams)
      
      // Save to sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`setup_teams_${id}`, JSON.stringify(newTeams))
      }
    }

    loadData()
  }, [courtIdentifier])

  // Save teams to sessionStorage whenever they change
  useEffect(() => {
    if (teams && courtId && typeof window !== 'undefined') {
      sessionStorage.setItem(`setup_teams_${courtId}`, JSON.stringify(teams))
    }
  }, [teams, courtId])

  function handlePlayerSelect(team: 'a' | 'b', index: number) {
    const player = teams?.[team === 'a' ? 'teamA' : 'teamB'][index]
    if (!player) return

    if (!selectedPlayer) {
      setSelectedPlayer(`${team}-${index}`)
    } else if (selectedPlayer === `${team}-${index}`) {
      setSelectedPlayer(null)
    } else {
      // Swap the two players
      const [selectedTeam, selectedIndex] = selectedPlayer.split('-')
      const selectedPlayerName = teams?.[selectedTeam === 'a' ? 'teamA' : 'teamB'][Number(selectedIndex)]
      
      if (selectedPlayerName && teams) {
        const newTeams = { ...teams }
        const temp = newTeams[team === 'a' ? 'teamA' : 'teamB'][index]
        newTeams[team === 'a' ? 'teamA' : 'teamB'][index] = selectedPlayerName
        newTeams[selectedTeam === 'a' ? 'teamA' : 'teamB'][Number(selectedIndex)] = temp
        setTeams(newTeams)
        setSelectedPlayer(null)
      }
    }
  }

  function handlePlayerEdit(team: 'a' | 'b', index: number, newName: string) {
    if (!teams) return

    const newTeams = { ...teams }
    newTeams[team === 'a' ? 'teamA' : 'teamB'][index] = newName || null
    setTeams(newTeams)
    setEditingPlayer(null)
  }

  async function handleStartGame() {
    if (!courtId || !teams) return

    setActionLoading(true)
    setError(null)

    // Read side swap and session_id from sessionStorage
    const savedSideSwap = typeof window !== 'undefined'
      ? sessionStorage.getItem(`setup_side_swap_${courtId}`)
      : null
    const sideSwapEnabled = savedSideSwap ? JSON.parse(savedSideSwap) : true
    const sessionId = typeof window !== 'undefined'
      ? sessionStorage.getItem(`setup_session_id_${courtIdentifier}`)
      : null

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          court_id: courtId,
          session_id: sessionId || undefined,
          game_mode: gameMode,
          sets_to_win: setsToWin,
          side_swap_enabled: sideSwapEnabled,
          team_a_player_1: teams.teamA[0] || undefined,
          team_a_player_2: teams.teamA[1] || undefined,
          team_b_player_1: teams.teamB[0] || undefined,
          team_b_player_2: teams.teamB[1] || undefined,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to create match')
        setActionLoading(false)
        return
      }

      // Clear setup form data but KEEP the session ID (needed by playing page)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`setup_players_${courtId}`)
        sessionStorage.removeItem(`setup_game_mode_${courtId}`)
        sessionStorage.removeItem(`setup_sets_${courtId}`)
        sessionStorage.removeItem(`setup_teams_${courtId}`)
        // NOTE: Do NOT remove session_id - it's needed by the playing page
      }

      // Redirect to playing page
      router.push(`/playing/${courtIdentifier}`)
    } catch (err) {
      console.error('Error creating match:', err)
      setError('Failed to create match')
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="teams-page">
        <div className="teams-loading">Loading...</div>
        <style jsx>{`
          .teams-page {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .teams-loading {
            font-size: 1.5rem;
          }
        `}</style>
      </div>
    )
  }

  if (error && !court) {
    return (
      <div className="teams-page">
        <div className="teams-error">{error}</div>
        <style jsx>{`
          .teams-page {
            min-height: 100vh;
            background: #1a1a2e;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .teams-error {
            font-size: 1.5rem;
            color: #ef4444;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="teams-page">
      <div className="teams-container">
        <div className="teams-header">
          <h1 className="teams-title">Confirm Teams</h1>
          <button
            className="teams-back-link"
            onClick={() => router.push(`/setup/${courtIdentifier}`)}
          >
            ← Back
          </button>
        </div>

        {error && <div className="teams-error-message">{error}</div>}

        {teams && (
          <div className="teams-swap">
            <div className="teams-swap-teams">
              <div className="teams-swap-team">
                <div className="teams-swap-team-label">Team A</div>
                {teams.teamA.map((player, index) => (
                  <div key={`a-${index}`}>
                    {editingPlayer?.team === 'a' && editingPlayer.index === index ? (
                      <input
                        type="text"
                        className="teams-edit-input"
                        value={player || ''}
                        onChange={(e) => handlePlayerEdit('a', index, e.target.value)}
                        onBlur={() => setEditingPlayer(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingPlayer(null)
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        className={`teams-swap-player ${selectedPlayer === `a-${index}` ? 'selected' : ''} ${!player ? 'empty' : ''}`}
                        onClick={() => {
                          if (player) {
                            handlePlayerSelect('a', index)
                          }
                        }}
                        onDoubleClick={() => {
                          if (player) {
                            setEditingPlayer({ team: 'a', index })
                            setSelectedPlayer(null)
                          }
                        }}
                      >
                        {player || '—'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="teams-swap-vs">vs</div>

              <div className="teams-swap-team">
                <div className="teams-swap-team-label">Team B</div>
                {teams.teamB.map((player, index) => (
                  <div key={`b-${index}`}>
                    {editingPlayer?.team === 'b' && editingPlayer.index === index ? (
                      <input
                        type="text"
                        className="teams-edit-input"
                        value={player || ''}
                        onChange={(e) => handlePlayerEdit('b', index, e.target.value)}
                        onBlur={() => setEditingPlayer(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingPlayer(null)
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        className={`teams-swap-player ${selectedPlayer === `b-${index}` ? 'selected' : ''} ${!player ? 'empty' : ''}`}
                        onClick={() => {
                          if (player) {
                            handlePlayerSelect('b', index)
                          }
                        }}
                        onDoubleClick={() => {
                          if (player) {
                            setEditingPlayer({ team: 'b', index })
                            setSelectedPlayer(null)
                          }
                        }}
                      >
                        {player || '—'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedPlayer && (
              <div className="teams-swap-hint">Tap another player to swap</div>
            )}

            <div className="teams-edit-note">
              Double-tap a name to edit, or tap two names to swap
            </div>
          </div>
        )}

        <button
          className="teams-button teams-button-primary"
          onClick={handleStartGame}
          disabled={!!actionLoading || !teams}
        >
          {actionLoading ? 'Starting...' : 'Start Game'}
        </button>
      </div>

      <style jsx>{`
        .teams-page {
          min-height: 100vh;
          background: #1a1a2e;
          color: #fff;
          padding: 2rem 1rem;
        }
        .teams-container {
          max-width: 600px;
          margin: 0 auto;
        }
        .teams-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .teams-title {
          font-size: 2rem;
          margin: 0;
        }
        .teams-back-link {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: underline;
          font-size: 1rem;
          cursor: pointer;
          padding: 0.5rem;
        }
        .teams-back-link:active {
          opacity: 0.8;
        }
        .teams-error-message {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .teams-swap {
          margin-bottom: 2rem;
        }
        .teams-swap-teams {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .teams-swap-team {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 0.5rem;
          border: 2px solid rgba(59, 130, 246, 0.3);
        }
        .teams-swap-team:last-of-type {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }
        .teams-swap-team-label {
          font-size: 1rem;
          font-weight: 600;
          opacity: 0.9;
        }
        .teams-swap-vs {
          text-align: center;
          font-size: 1.5rem;
          opacity: 0.5;
          margin: -0.5rem 0;
        }
        .teams-swap-player {
          min-height: 48px;
          padding: 0.75rem 1rem;
          font-size: 1.1rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }
        .teams-swap-player.empty {
          opacity: 0.5;
          font-style: italic;
        }
        .teams-swap-player.selected {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.2);
        }
        .teams-swap-player:active {
          transform: scale(0.98);
        }
        .teams-edit-input {
          min-height: 48px;
          padding: 0.75rem 1rem;
          font-size: 1.1rem;
          border: 2px solid #22c55e;
          border-radius: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          width: 100%;
        }
        .teams-edit-input:focus {
          outline: none;
        }
        .teams-edit-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        .teams-swap-hint {
          text-align: center;
          font-size: 0.9rem;
          opacity: 0.7;
          padding: 0.75rem;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 0.5rem;
          margin-top: 1rem;
        }
        .teams-edit-note {
          text-align: center;
          font-size: 0.85rem;
          opacity: 0.6;
          margin-top: 1rem;
        }
        .teams-button {
          min-height: 48px;
          padding: 0.75rem 1.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .teams-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .teams-button-primary {
          background: #22c55e;
          color: #fff;
        }
        .teams-button-primary:not(:disabled):active {
          background: #16a34a;
          transform: scale(0.98);
        }
      `}</style>
    </div>
  )
}
