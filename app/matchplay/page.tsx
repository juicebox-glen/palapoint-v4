'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, getMatchplayVenueId } from '@/lib/supabase'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import { MatchplayLauncherModePicker } from '@/components/MatchplayLauncherModePicker'
import '@/app/styles/matchplay.css'
import '@/app/styles/setup-form.css'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface MatchplayEvent {
  id: string
  name: string
  status: string
  created_at: string
  player_count?: number
  match_count?: number
}

function formatEventDate(createdAt: string): string {
  const d = new Date(createdAt)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${days[d.getDay()]} ${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`
}

async function callMatchplayEvent(body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/matchplay-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

/**
 * Launcher: game mode list + past events when idle; continue card when an event is active.
 * No PIN gate (venue from env / Supabase only).
 */
export default function MatchplayPage() {
  const router = useRouter()
  const [venueId, setVenueId] = useState<string | null>(null)
  const [venueResolveDone, setVenueResolveDone] = useState(false)
  const [events, setEvents] = useState<MatchplayEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    if (!venueId) return

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await callMatchplayEvent({ action: 'list', venue_id: venueId })
        const list = result.events ?? []
        if (list.length > 0) {
          const { data: players } = await supabase.from('matchplay_players').select('event_id')
          const counts: Record<string, number> = {}
          for (const p of players ?? []) {
            counts[p.event_id] = (counts[p.event_id] ?? 0) + 1
          }
          const { data: rounds } = await supabase.from('matchplay_rounds').select('event_id')
          const roundCounts: Record<string, number> = {}
          for (const r of rounds ?? []) {
            roundCounts[r.event_id] = (roundCounts[r.event_id] ?? 0) + 1
          }
          setEvents(
            list.map((e: MatchplayEvent) => ({
              ...e,
              player_count: counts[e.id] ?? 0,
              match_count: roundCounts[e.id] ?? 0,
            }))
          )
        } else {
          setEvents([])
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load events')
        setEvents([])
      }
      setLoading(false)
    }
    load()
  }, [venueId])

  const activeEvent = events.find((e) => e.status === 'setup' || e.status === 'in_progress')
  const pastEvents = events
    .filter((e) => e.status === 'completed')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  if (!venueResolveDone || (venueId !== null && loading)) {
    return (
      <div className="matchplay-launcher matchplay-launcher--compact">
        <SetupScreenHeader />
        <p className="matchplay-loading-text">Loading...</p>
      </div>
    )
  }

  if (!venueId && error) {
    return (
      <div className="matchplay-launcher matchplay-launcher--compact">
        <SetupScreenHeader />
        <div className="matchplay-error" role="alert" style={{ margin: '1rem' }}>
          {error}
        </div>
      </div>
    )
  }

  if (activeEvent) {
    return (
      <div className="matchplay-launcher">
        <h1 className="matchplay-launcher-title">Matchplay</h1>
        <div className="matchplay-active-event-card">
          <div className="matchplay-active-event-status">
            <span
              className={`matchplay-status-dot ${activeEvent.status === 'in_progress' ? 'matchplay-status-dot-live' : 'matchplay-status-dot-setup'}`}
              aria-hidden
            />
            <span>{activeEvent.status === 'in_progress' ? 'LIVE' : 'SETUP'}</span>
          </div>
          <div className="matchplay-active-event-name">{activeEvent.name}</div>
          <div className="matchplay-active-event-meta">
            Round {(activeEvent.match_count ?? 0) || 1} of {(activeEvent.match_count ?? 0) || 1} ·{' '}
            {activeEvent.player_count ?? 0} players
          </div>
          <button
            type="button"
            className="btn btn-primary matchplay-continue-btn"
            onClick={() => router.push(`/matchplay/${activeEvent.id}`)}
          >
            CONTINUE EVENT
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="matchplay-launcher matchplay-launcher--compact">
      <SetupScreenHeader />
      {error ? (
        <div className="matchplay-error" role="alert" style={{ margin: '0 1rem 1rem' }}>
          {error}
        </div>
      ) : null}
      <MatchplayLauncherModePicker />

      {pastEvents.length > 0 && (
        <div className="matchplay-past-events">
          <h3 className="matchplay-past-title">Past Events</h3>
          <div className="matchplay-past-list">
            {pastEvents.map((ev) => (
              <Link key={ev.id} href={`/matchplay/${ev.id}`} className="matchplay-past-item">
                <span className="matchplay-past-name">{ev.name}</span>
                <span className="matchplay-past-meta">
                  {formatEventDate(ev.created_at)} · {ev.player_count ?? 0} players
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
