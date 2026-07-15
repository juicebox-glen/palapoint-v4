'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PalaLiveAvatar } from '@/components/palalive/PalaLiveAvatar'
import { formatPlayerName } from '@/lib/utils/name-format'
import {
  callMatchplayEvent,
  callMatchplayPlayer,
  callMatchplayRound,
} from '@/lib/api/matchplay'
import { useStaffSocialNightPaths } from '@/lib/hooks/useStaffSocialNightPaths'
import { StaffAppFrame } from '@/components/venue-screen/StaffAppFrame'
import '@/app/styles/palalive-tokens.css'
import '@/app/styles/palalive-staff.css'

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
      <div className="palalive-staff-shell">
        <p className="palalive-staff-loading-text">Loading results...</p>
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
    <div className="palalive-staff-shell">
      <StaffAppFrame
        venueSlug={venueSlug ?? undefined}
        onBack={goBackToEventHub}
        footer={
          <>
            <button
              type="button"
              className="palalive-staff-btn palalive-staff-btn--secondary"
              onClick={() => router.push(staffPath(`/${eventId}/standings`))}
            >
              Detailed standings
            </button>
            <button
              type="button"
              className="palalive-staff-btn palalive-staff-btn--primary"
              onClick={() => router.push(staffBase ?? '/matchplay')}
            >
              Start new event
            </button>
          </>
        }
      >
        <header className="palalive-staff-results-header">
          <h1 className="palalive-staff-results-title">Event complete</h1>
          <p className="palalive-staff-results-subtitle">
            {playerCount} players · {completedRoundsCount} of {totalRounds || '—'} rounds
          </p>
        </header>

        <div className="palalive-staff-body">
          {error ? <p className="palalive-staff-error">{error}</p> : null}

          {leaders.length > 0 && (
            <div className="palalive-staff-winner">
              <span className="palalive-staff-winner-trophy" aria-hidden>
                🏆
              </span>
              <PalaLiveAvatar name={formatPlayerName(winnerNamesJoined, 'full')} photoUrl={winnerAvatarUrl} />
              <h2 className="palalive-staff-winner-name">{formatPlayerName(winnerNamesJoined, 'full')}</h2>
              <p className="palalive-staff-winner-stats">
                {winnerPts} pts · GD {gdSigned}
              </p>
            </div>
          )}

          <p className="palalive-staff-section-label">Final standings</p>
          {standings.length === 0 ? (
            <p className="palalive-staff-standings-empty">No standings for this event.</p>
          ) : (
            <div className="palalive-staff-standings">
              {standings.map((player) => {
                const diff = player.game_difference ?? 0
                const name = formatPlayerName(player.name, 'full')
                return (
                  <div key={player.id} className="palalive-staff-standings-row">
                    <PalaLiveAvatar name={name} photoUrl={player.photo_url} />
                    <div className="palalive-staff-standings-info">
                      <span className="palalive-staff-standings-name">{name}</span>
                    </div>
                    <span className={`palalive-staff-standings-delta ${diff >= 0 ? 'is-pos' : 'is-neg'}`}>
                      {diff >= 0 ? '+' : ''}
                      {diff}
                    </span>
                    <span className="palalive-staff-chip">{player.total_points ?? 0}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </StaffAppFrame>
    </div>
  )
}
