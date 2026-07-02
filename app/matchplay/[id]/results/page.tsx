'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatPlayerName, getPlayerInitials } from '@/lib/utils/name-format'
import {
  callMatchplayEvent,
  callMatchplayPlayer,
  callMatchplayRound,
} from '@/lib/api/matchplay'
import { useStaffSocialNightPaths } from '@/lib/hooks/useStaffSocialNightPaths'
import { StaffAppFrame } from '@/components/venue-screen/StaffAppFrame'
import '@/app/styles/matchplay.css'

interface StandingsPlayer {
  id: string
  name: string
  photo_url?: string | null
  total_points: number
  game_difference: number
  rank: number
}

export default function MatchplayResultsPage() {
  const router = useRouter()
  const params = useParams()
  const { path: staffPath, base: staffBase, venueSlug } = useStaffSocialNightPaths()
  const eventId = params.id as string
  const goBackToEventHub = () => router.push(staffPath(`/${eventId}`))

  const [playerCount, setPlayerCount] = useState(0)
  const [totalRounds, setTotalRounds] = useState(0)
  const [completedRoundsCount, setCompletedRoundsCount] = useState(0)
  const [standings, setStandings] = useState<StandingsPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadResults = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [eventData, standingsData, roundsData] = await Promise.all([
        callMatchplayEvent({ action: 'get', event_id: eventId }),
        callMatchplayPlayer({ action: 'standings', event_id: eventId }),
        callMatchplayRound({ action: 'list_rounds', event_id: eventId }),
      ])

      if (eventData.event) {
        setPlayerCount((eventData.event as { player_count?: number }).player_count ?? 0)
      } else {
        setError(eventData.error || 'Event not found')
        setLoading(false)
        return
      }

      const roundRows = (roundsData.rounds ?? []) as { status?: string }[]
      setTotalRounds(roundRows.length)
      setCompletedRoundsCount(roundRows.filter((r) => r.status === 'completed').length)

      if (standingsData.success && Array.isArray(standingsData.standings)) {
        setStandings(standingsData.standings as StandingsPlayer[])
      } else {
        setError(standingsData.error || 'Failed to load standings')
      }
    } catch (err) {
      console.error('[Results] Load error:', err)
      setError('Failed to load results')
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    void loadResults()
  }, [loadResults])

  if (loading) {
    return (
      <div className="matchplay-page matchplay-page--setup matchplay-results-page">
        <div className="matchplay-loading">Loading results...</div>
      </div>
    )
  }

  const leaders = standings.filter((s) => (s.rank ?? 999) === 1)
  const winnerAvatarUrl = leaders[0]?.photo_url
  const winnerNamesJoined = leaders.map((l) => l.name).join(' & ')
  const winnerPts = leaders[0]?.total_points ?? 0
  const winnerGd = leaders[0]?.game_difference ?? 0
  const gdSigned = `${winnerGd >= 0 ? '+' : ''}${winnerGd}`

  return (
    <StaffAppFrame venueSlug={venueSlug ?? undefined} onBack={goBackToEventHub}>
      <div className="matchplay-page matchplay-page--setup matchplay-results-page">
      <header className="matchplay-results-header">
        <h1 className="matchplay-results-title">Event complete</h1>
        <p className="matchplay-results-subtitle">
          {playerCount} players · {completedRoundsCount} of {totalRounds || '—'} rounds
        </p>
      </header>

      {error ? (
        <p className="matchplay-error" style={{ margin: '0 var(--ui-space-lg)' }}>
          {error}
        </p>
      ) : null}

      {leaders.length > 0 && (
        <div className="matchplay-results-winner">
          <span className="matchplay-results-trophy" aria-hidden>
            🏆
          </span>
          <div className="matchplay-results-winner-avatar">
            {winnerAvatarUrl ? (
              <img src={winnerAvatarUrl} alt="" />
            ) : (
              <span className="matchplay-results-winner-initials">{getPlayerInitials(winnerNamesJoined)}</span>
            )}
          </div>
          <h2 className="matchplay-results-winner-name">{formatPlayerName(winnerNamesJoined, 'full')}</h2>
          <p className="matchplay-results-winner-stats">
            {winnerPts} pts · GD {gdSigned}
          </p>
        </div>
      )}

      <div className="matchplay-results-standings">
        <h3 className="matchplay-results-standings-title">Final standings</h3>
        {standings.length === 0 ? (
          <p className="matchplay-standings-empty">No standings for this event.</p>
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

      <footer className="matchplay-results-footer">
        <div className="matchplay-results-footer-actions">
          <button type="button" className="btn btn--secondary btn--full" onClick={() => router.push(staffPath(`/${eventId}/standings`))}>
            Detailed standings
          </button>
          <button type="button" className="btn btn--primary btn--full" onClick={() => router.push(staffBase ?? '/matchplay')}>
            Start new event
          </button>
        </div>
      </footer>
      </div>
    </StaffAppFrame>
  )
}
