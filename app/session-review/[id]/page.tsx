'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { abbreviateSurname } from '@/lib/utils/player-names'
import Header from '@/components/ui/Header'

interface Game {
  id: string
  team_a_player_1: string | null
  team_a_player_2: string | null
  team_b_player_1: string | null
  team_b_player_2: string | null
  winner: string | null
  set_scores: Array<{
    team_a?: number
    team_b?: number
    team_a_games?: number
    team_b_games?: number
  }>
  team_a_games?: number
  team_b_games?: number
  created_at: string
  completed_at: string | null
  status?: string
  live_match_id?: string
}

interface Session {
  id: string
  court_id: string
  started_at: string
  ended_at: string | null
}

export default function SessionReviewPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [courtName, setCourtName] = useState('')

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
          setCourtName(court.name || 'Court')
        }
      }

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

      const archivedIds = new Set(
        (archivedResult.data || [])
          .map((g: Game) => g.live_match_id)
          .filter(Boolean)
      )
      const liveOnly = (liveResult.data || []).filter(
        (g: Game) => !archivedIds.has(g.id)
      )
      const allGames = [...(archivedResult.data || []), ...liveOnly]

      allGames.sort(
        (a: Game, b: Game) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      if (allGames.length > 0) setGames(allGames)

      setLoading(false)
    }

    loadData()
  }, [sessionId])

  const getTeamLabel = (
    name: string | null | undefined,
    fallback: string
  ): string => {
    if (!name?.trim()) return fallback
    return abbreviateSurname(name)
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

  return (
    <div className="page page-padded" style={{ paddingTop: '1rem' }}>
      <Header
        showLogo
        status="complete"
        statusText="SESSION COMPLETE"
        courtName={courtName}
      />

      <div style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
        {/* Single GAMES section card */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
          }}
        >
          <h3 className="card-title">GAMES</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {games.length === 0 ? (
              <p
                style={{
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: '1rem',
                }}
              >
                No games played
              </p>
            ) : (
              games.map((game) => {
                const lastSet = game.set_scores?.length
                  ? game.set_scores[game.set_scores.length - 1]
                  : null
                const teamAScore =
                  lastSet?.team_a_games ??
                  lastSet?.team_a ??
                  game.team_a_games ??
                  0
                const teamBScore =
                  lastSet?.team_b_games ??
                  lastSet?.team_b ??
                  game.team_b_games ??
                  0

                return (
                  <div
                    key={game.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1rem',
                      cursor: 'pointer',
                      border: '1px solid var(--border-default)',
                    }}
                    onClick={() => router.push(`/game/${game.id}`)}
                  >
                    {/* Team A - default to Team A if no names */}
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.125rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {getTeamLabel(game.team_a_player_1, 'Team A')}
                      </span>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {getTeamLabel(game.team_a_player_2, '')}
                      </span>
                    </div>

                    {/* Score - always show last score, 0-0 if none */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0 1rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '2rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          fontVariantNumeric: 'tabular-nums',
                          minWidth: '1.5rem',
                          textAlign: 'right',
                        }}
                      >
                        {teamAScore}
                      </span>
                      <span
                        style={{
                          fontSize: '1rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        –
                      </span>
                      <span
                        style={{
                          fontSize: '2rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          fontVariantNumeric: 'tabular-nums',
                          minWidth: '1.5rem',
                          textAlign: 'left',
                        }}
                      >
                        {teamBScore}
                      </span>
                    </div>

                    {/* Team B - default to Team B if no names */}
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '0.125rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {getTeamLabel(game.team_b_player_1, 'Team B')}
                      </span>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {getTeamLabel(game.team_b_player_2, '')}
                      </span>
                    </div>

                    {/* Chevron */}
                    <div
                      style={{
                        marginLeft: '0.75rem',
                        color: 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M7 5l5 5-5 5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Stats section (no card wrapper) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '4rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '3rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              {games.length}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                marginTop: '0.5rem',
              }}
            >
              GAMES PLAYED
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '3rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              {totalMinutes}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                marginTop: '0.5rem',
              }}
            >
              TOTAL TIME (M)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
