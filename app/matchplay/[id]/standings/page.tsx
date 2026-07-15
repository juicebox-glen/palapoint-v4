'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PalaLiveAvatar } from '@/components/palalive/PalaLiveAvatar'
import { formatPlayerName } from '@/lib/utils/name-format'
import { callMatchplayPlayer } from '@/lib/api/matchplay'
import { StaffAppFrame } from '@/components/venue-screen/StaffAppFrame'
import { useStaffSocialNightPaths } from '@/lib/hooks/useStaffSocialNightPaths'
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

export default function MatchplayStandingsPage() {
  const router = useRouter()
  const params = useParams()
  const { path: staffPath, venueSlug } = useStaffSocialNightPaths()
  const eventId = params.id as string
  const goBackToEventHub = () => router.push(staffPath(`/${eventId}`))

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
      <div className="palalive-staff-shell">
        <p className="palalive-staff-loading-text">Loading standings...</p>
      </div>
    )
  }

  return (
    <div className="palalive-staff-shell">
      <StaffAppFrame venueSlug={venueSlug ?? undefined} onBack={goBackToEventHub}>
        <h1 className="palalive-staff-page-title">Standings</h1>

        <div className="palalive-staff-body">
          {error && <p className="palalive-staff-error">{error}</p>}

          {standings.length === 0 ? (
            <p className="palalive-staff-standings-empty">Standings will appear after Round 1 is completed</p>
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
