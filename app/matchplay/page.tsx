'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMatchplayVenueId } from '@/lib/supabase'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import '@/app/styles/matchplay.css'
import '@/app/styles/setup-form.css'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface MatchplayEvent {
  id: string
  name: string
  status: string
  created_at: string
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
 * Entry route: resolves venue → loads events once → redirects.
 * Active setup/in-progress → event hub; otherwise → `/matchplay/new` (Americano setup).
 * No launcher or PIN gate.
 */
export default function MatchplayPage() {
  const router = useRouter()
  const redirectStarted = useRef(false)
  const [venueId, setVenueId] = useState<string | null>(null)
  const [venueResolveDone, setVenueResolveDone] = useState(false)
  const [events, setEvents] = useState<MatchplayEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [eventsReady, setEventsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function resolve() {
      try {
        const vid = await getMatchplayVenueId()
        if (!vid) {
          setError('No venue configured. Set NEXT_PUBLIC_MATCHPLAY_VENUE_ID or add a venue.')
          return
        }
        setVenueId(vid)
      } catch (err) {
        console.error(err)
        setError('Failed to load venue')
      } finally {
        setVenueResolveDone(true)
      }
    }
    resolve()
  }, [])

  useEffect(() => {
    if (!venueId) return

    async function load() {
      setLoadingEvents(true)
      setError(null)
      try {
        const result = await callMatchplayEvent({ action: 'list', venue_id: venueId })
        setEvents(result.events ?? [])
      } catch (err) {
        console.error(err)
        setError('Failed to load events')
        setEvents([])
      } finally {
        setLoadingEvents(false)
        setEventsReady(true)
      }
    }
    load()
  }, [venueId])

  const readyToRoute =
    venueResolveDone && !!venueId && eventsReady && !error

  useLayoutEffect(() => {
    if (!readyToRoute || redirectStarted.current) return
    redirectStarted.current = true
    const active = events.find((e) => e.status === 'setup' || e.status === 'in_progress')
    const path = active ? `/matchplay/${active.id}` : '/matchplay/new'
    router.replace(path)
  }, [readyToRoute, events, router])

  /** Waiting on venue bootstrap or events list fetch. */
  const showBootstrapLoading =
    !venueResolveDone || (!!venueId && !eventsReady) || loadingEvents

  if (showBootstrapLoading && !(venueResolveDone && !venueId && error)) {
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
        <div className="matchplay-error" style={{ margin: '1rem' }} role="alert">
          {error}
        </div>
      </div>
    )
  }

  /** Events request failed — stay here with message (no PIN, no launcher). */
  if (venueId && error) {
    return (
      <div className="matchplay-launcher matchplay-launcher--compact">
        <SetupScreenHeader />
        <div className="matchplay-error" style={{ margin: '1rem' }} role="alert">
          {error}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ margin: '0 1rem' }}
          onClick={() => {
            redirectStarted.current = false
            setEventsReady(false)
            setLoadingEvents(true)
            void callMatchplayEvent({ action: 'list', venue_id: venueId })
              .then((result) => {
                setEvents(result.events ?? [])
                setError(null)
              })
              .catch(() => setError('Failed to load events'))
              .finally(() => {
                setLoadingEvents(false)
                setEventsReady(true)
              })
          }}
        >
          Retry
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          style={{ margin: '0.75rem 1rem' }}
          onClick={() => router.replace('/matchplay/new')}
        >
          Go to event setup
        </button>
      </div>
    )
  }

  return (
    <div className="matchplay-launcher matchplay-launcher--compact">
      <SetupScreenHeader />
      <p className="matchplay-loading-text">Loading...</p>
    </div>
  )
}
