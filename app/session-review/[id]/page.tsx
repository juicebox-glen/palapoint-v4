'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import '@/app/styles/session-review.css'

interface Game {
  id: string
  team_a_player_1: string | null
  team_a_player_2: string | null
  team_b_player_1: string | null
  team_b_player_2: string | null
  winner: string | null
  set_scores: Array<{ team_a: number; team_b: number }>
  created_at: string
  completed_at: string | null
  status?: string
  live_match_id?: string
}

interface Session {
  id: string
  court_id: string
  started_at: string
  ended_at: string
}

export default function SessionReviewPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [courtName, setCourtName] = useState('')
  const [courtSlug, setCourtSlug] = useState<string>('')

  useEffect(() => {
    async function loadData() {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionData) {
        setSession(sessionData as Session)

        const { data: court } = await supabase
          .from('courts')
          .select('name, slug')
          .eq('id', sessionData.court_id)
          .single()

        if (court) {
          setCourtName(court.name || '')
          setCourtSlug((court as { slug?: string }).slug || '')
        }
      }

      // Get games from both live_matches (completed but not archived) and matches (archived)
      const [liveResult, archivedResult] = await Promise.all([
        supabase
          .from('live_matches')
          .select('*')
          .eq('session_id', sessionId)
          .in('status', ['completed', 'abandoned'])
          .order('created_at', { ascending: true }),
        supabase
          .from('matches')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true }),
      ])

      // Combine and deduplicate (prefer archived if both exist)
      const archivedIds = new Set(
        (archivedResult.data || [])
          .map((g: Game) => g.live_match_id)
          .filter(Boolean)
      )
      const liveOnly = (liveResult.data || []).filter(
        (g: Game) => !archivedIds.has(g.id)
      )
      const allGames = [...(archivedResult.data || []), ...liveOnly]

      // Sort by created_at
      allGames.sort(
        (a: Game, b: Game) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      if (allGames.length > 0) setGames(allGames)

      setLoading(false)
    }

    loadData()
  }, [sessionId])

  const formatTeamName = (
    player1: string | null,
    player2: string | null,
    fallback: string
  ) => {
    const names = [player1, player2].filter(Boolean)
    return names.length > 0 ? names.join(' / ') : fallback
  }

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const minutes = Math.round(
      (endDate.getTime() - startDate.getTime()) / 1000 / 60
    )
    return `${minutes} mins`
  }

  const handleDone = () => {
    if (courtSlug) {
      router.push(`/setup/${courtSlug}`)
    } else {
      window.history.back()
    }
  }

  if (loading) {
    return (
      <div className="review-container">
        <div className="review-loading">Loading...</div>
      </div>
    )
  }

  const totalMinutes =
    session?.started_at && session?.ended_at
      ? Math.round(
          (new Date(session.ended_at).getTime() -
            new Date(session.started_at).getTime()) /
            1000 /
            60
        )
      : 0

  return (
    <div className="review-container">
      <div className="review-header">
        <h1>Session Complete</h1>
        <p className="review-meta">
          {courtName} • {totalMinutes} minutes total
        </p>
      </div>

      <div className="review-games">
        {games.length === 0 ? (
          <p className="review-no-games">No games played</p>
        ) : (
          games.map((game, index) => {
            const winnerName =
              !game.winner
                ? 'Abandoned'
                : game.winner === 'a'
                  ? formatTeamName(
                      game.team_a_player_1,
                      game.team_a_player_2,
                      'Team A'
                    )
                  : formatTeamName(
                      game.team_b_player_1,
                      game.team_b_player_2,
                      'Team B'
                    )

            const score =
              game.set_scores && game.set_scores.length > 0
                ? game.set_scores
                    .map((s) => `${s.team_a}-${s.team_b}`)
                    .join(', ')
                : 'N/A'

            const duration =
              game.created_at && game.completed_at
                ? formatDuration(game.created_at, game.completed_at)
                : null

            return (
              <div key={game.id} className="review-game-card">
                <div className="review-game-header">
                  <span className="review-game-number">Game {index + 1}</span>
                  {duration && (
                    <span className="review-game-duration">{duration}</span>
                  )}
                </div>
                <div className="review-game-result">
                  <span className="review-game-winner">
                    {winnerName === 'Abandoned' ? winnerName : `${winnerName} WIN`}
                  </span>
                  <span className="review-game-score">{score}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="review-summary">
        <div className="review-stat">
          <span className="review-stat-value">{games.length}</span>
          <span className="review-stat-label">Games Played</span>
        </div>
        <div className="review-stat">
          <span className="review-stat-value">{totalMinutes}</span>
          <span className="review-stat-label">Total Minutes</span>
        </div>
      </div>

      <button className="review-done-btn" onClick={handleDone}>
        Done
      </button>
    </div>
  )
}
