'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatPlayerName, getPlayerInitials } from '@/lib/utils/name-format'
import { callMatchplayPlayer } from '@/lib/api/matchplay'
import { StaffFlowHeaderBar } from '@/components/venue-screen/StaffPageShell'
import '@/app/styles/matchplay.css'

interface StandingsPlayer {
  id: string
  name: string
  photo_url?: string | null
  total_points: number
  game_difference: number
  rank: number
}

export default function MatchplayStandingsPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [standings, setStandings] = useState<StandingsPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await callMatchplayPlayer({ action: 'standings', event_id: eventId })
        if (cancelled) return
        if (data.success === false) {
          setError(typeof data.error === 'string' ? data.error : 'Failed to load standings')
        } else if (Array.isArray(data.standings)) {
          setStandings(data.standings as StandingsPlayer[])
        } else {
          setError(data.error || 'Failed to load standings')
        }
      } catch {
        if (!cancelled) setError('Failed to load standings')
      }
      if (!cancelled) setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [eventId])

  if (loading) {
    return (
      <div className="matchplay-page matchplay-page--setup">
        <div className="matchplay-loading">Loading standings...</div>
      </div>
    )
  }

  return (
    <div className="staff-page matchplay-page matchplay-page--setup">
      <StaffFlowHeaderBar />
      <div className="staff-shell">
      <header className="matchplay-page-header">
        <button type="button" onClick={() => router.back()} className="matchplay-back-btn">
          ← Back
        </button>
        <h1 className="matchplay-page-title">Standings</h1>
        <span className="matchplay-page-header-spacer" aria-hidden />
      </header>

      <div className="matchplay-setup-inner matchplay-standings-content">
        {error && <div className="matchplay-error">{error}</div>}

        {standings.length === 0 ? (
          <p className="matchplay-standings-empty">Standings will appear after Round 1 is completed</p>
        ) : (
          <div className="matchplay-standings-list">
            {standings.map((player) => {
              const rank = player.rank
              const isTopThree = rank <= 3

              return (
                <div
                  key={player.id}
                  className={`matchplay-standings-row ${isTopThree ? `matchplay-standings-row--rank-${rank}` : ''}`}
                >
                  <div className="matchplay-standings-rank">
                    {rank === 1 && <span className="matchplay-standings-medal">🏆</span>}
                    {rank === 2 && <span className="matchplay-standings-medal">🥈</span>}
                    {rank === 3 && <span className="matchplay-standings-medal">🥉</span>}
                    {rank > 3 && <span className="matchplay-standings-rank-num">{rank}</span>}
                  </div>

                  <div className="matchplay-standings-avatar">
                    {player.photo_url ? (
                      <img src={player.photo_url} alt="" />
                    ) : (
                      <span className="matchplay-standings-initials">{getPlayerInitials(player.name)}</span>
                    )}
                  </div>

                  <div className="matchplay-standings-info">
                    <span className="matchplay-standings-name">{formatPlayerName(player.name, 'full')}</span>
                    <span className="matchplay-standings-stats">
                      {player.total_points ?? 0} pts
                      <span
                        className={`matchplay-standings-diff ${(player.game_difference ?? 0) >= 0 ? 'matchplay-standings-diff--positive' : 'matchplay-standings-diff--negative'}`}
                      >
                        {(player.game_difference ?? 0) >= 0 ? '+' : ''}
                        {player.game_difference ?? 0}
                      </span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
