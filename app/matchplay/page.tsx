'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getMatchplayVenueId } from '@/lib/supabase'
import { MatchplayLauncherModePicker } from '@/components/MatchplayLauncherModePicker'
import { StaffAppFrame } from '@/components/venue-screen/StaffAppFrame'
import { callMatchplayEvent } from '@/lib/api/matchplay'
import { captureVenueScreenStaffContext } from '@/lib/venue-screen-staff-context'
import { useStaffSocialNightPaths } from '@/lib/hooks/useStaffSocialNightPaths'
import '@/app/styles/palalive-tokens.css'
import '@/app/styles/palalive-staff.css'

interface MatchplayEvent {
  id: string
  name: string
  status: string
  created_at: string
  player_count?: number
  match_count?: number
}

/**
 * Launcher: game mode list when idle; continue card when an event is active.
 * No PIN gate (venue from env / Supabase only).
 */
export default function MatchplayPage() {
  const router = useRouter()
  const { path: staffPath, venueSlug } = useStaffSocialNightPaths()
  const staffHomeHref = venueSlug ? `/staff/${venueSlug}` : null
  const frameNavProps = venueSlug && staffHomeHref
    ? {
        venueSlug,
        onBack: () => router.push(staffHomeHref),
      }
    : {}
  const [venueId, setVenueId] = useState<string | null>(null)
  const [venueResolveDone, setVenueResolveDone] = useState(false)
  const [events, setEvents] = useState<MatchplayEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [closingActiveEvent, setClosingActiveEvent] = useState(false)

  const loadEvents = useCallback(async () => {
    if (!venueId) return
    setLoading(true)
    setError(null)
    try {
      const result = await callMatchplayEvent({ action: 'list', venue_id: venueId })
      const list = (result.events as MatchplayEvent[] | undefined) ?? []
      const activeRow = list.find((e) => e.status === 'setup' || e.status === 'in_progress')
      if (!activeRow) {
        setEvents(list)
      } else {
        const [playersRes, roundsRes] = await Promise.all([
          supabase
            .from('matchplay_players')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', activeRow.id),
          supabase
            .from('matchplay_rounds')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', activeRow.id),
        ])
        const player_count = playersRes.count ?? 0
        const match_count = roundsRes.count ?? 0
        setEvents(
          list.map((e) => (e.id === activeRow.id ? { ...e, player_count, match_count } : e))
        )
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load events')
      setEvents([])
    }
    setLoading(false)
  }, [venueId])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const venueSlug = params.get('venue')?.trim()
    const screenSlug = params.get('screen')?.trim()
    captureVenueScreenStaffContext({
      venueSlug,
      screenSlug,
    })
    if (venueSlug && screenSlug) {
      router.replace(`/staff/${venueSlug}/social-night`)
    }
  }, [router])

  useEffect(() => {
    async function resolve() {
      try {
        const vid = await getMatchplayVenueId()
        if (!vid) {
          setError('No venue configured. Set NEXT_PUBLIC_MATCHPLAY_VENUE_ID or add a venue.')
          setLoading(false)
          return
        }
        setVenueId(vid)
      } catch (err) {
        console.error(err)
        setError('Failed to load venue')
        setLoading(false)
      } finally {
        setVenueResolveDone(true)
      }
    }
    resolve()
  }, [])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  const activeEvent = events.find((e) => e.status === 'setup' || e.status === 'in_progress')

  const handleCloseActiveEvent = async () => {
    if (!activeEvent) return
    const ok = window.confirm(
      'Mark this event as finished and clear it from the launcher? You can start a new Americano afterwards. Existing scores stay in the database.'
    )
    if (!ok) return
    setClosingActiveEvent(true)
    setError(null)
    try {
      const result = await callMatchplayEvent({ action: 'complete', event_id: activeEvent.id })
      if (!result.event) {
        setError((result.error as string | undefined) ?? 'Could not close event')
        return
      }
      await loadEvents()
    } catch (err) {
      console.error(err)
      setError('Could not close event')
    } finally {
      setClosingActiveEvent(false)
    }
  }

  if (!venueResolveDone || (venueId !== null && loading)) {
    return (
      <StaffAppFrame {...frameNavProps}>
        <p className="palalive-staff-loading-text">Loading…</p>
      </StaffAppFrame>
    )
  }

  if (!venueId && error) {
    return (
      <StaffAppFrame {...frameNavProps}>
        <p className="palalive-staff-error" role="alert">
          {error}
        </p>
      </StaffAppFrame>
    )
  }

  if (activeEvent) {
    return (
      <StaffAppFrame {...frameNavProps}>
        <div className="palalive-staff-body">
          <div className="palalive-staff-card">
            <span className="palalive-staff-card-label">
              {activeEvent.status === 'in_progress' ? 'Live event' : 'Setup in progress'}
            </span>
            <span className="palalive-staff-page-title" style={{ margin: 0, fontSize: 20 }}>
              {activeEvent.name}
            </span>
            <span className="palalive-staff-card-hint">
              Round {(activeEvent.match_count ?? 0) || 1} · {activeEvent.player_count ?? 0}{' '}
              players
            </span>
          </div>

          {error ? (
            <p className="palalive-staff-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            className="palalive-staff-btn palalive-staff-btn--primary"
            onClick={() => router.push(staffPath(`/${activeEvent.id}`))}
          >
            Continue event
          </button>
          <button
            type="button"
            className="palalive-staff-btn palalive-staff-btn--secondary"
            disabled={closingActiveEvent}
            onClick={() => void handleCloseActiveEvent()}
          >
            {closingActiveEvent ? 'Closing…' : 'Mark finished & clear launcher'}
          </button>
        </div>
      </StaffAppFrame>
    )
  }

  return (
    <StaffAppFrame {...frameNavProps}>
      {error ? (
        <p className="palalive-staff-error" role="alert">
          {error}
        </p>
      ) : null}
      <MatchplayLauncherModePicker />
    </StaffAppFrame>
  )
}
