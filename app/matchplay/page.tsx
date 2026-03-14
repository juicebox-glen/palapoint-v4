'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, getMatchplayVenueId, getFirstCourtForVenue, validateControlPin } from '@/lib/supabase'
import SetupScreenHeader from '@/components/SetupScreenHeader'
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

export default function MatchplayPage() {
  const router = useRouter()
  const [venueId, setVenueId] = useState<string | null>(null)
  const [courtId, setCourtId] = useState<string | null>(null)
  const [pinAuthenticated, setPinAuthenticated] = useState(false)
  const [pinLoading, setPinLoading] = useState(true)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [events, setEvents] = useState<MatchplayEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Resolve venue and court for PIN
  useEffect(() => {
    async function resolve() {
      try {
        const vid = await getMatchplayVenueId()
        if (!vid) {
          setError('No venue configured. Set NEXT_PUBLIC_MATCHPLAY_VENUE_ID or add a venue.')
          setPinLoading(false)
          setLoading(false)
          return
        }
        setVenueId(vid)
        const court = await getFirstCourtForVenue(vid)
        if (court) {
          setCourtId(court.id)
          const stored = sessionStorage.getItem(`control_pin_${court.id}`)
          if (stored) {
            const valid = await validateControlPin(court.id, stored)
            if (valid) setPinAuthenticated(true)
            else sessionStorage.removeItem(`control_pin_${court.id}`)
          }
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load venue')
      }
      setPinLoading(false)
    }
    resolve()
  }, [])

  async function handlePinSubmit() {
    if (!courtId || pin.length !== 4) return
    setPinError(null)
    setPinLoading(true)
    try {
      const valid = await validateControlPin(courtId, pin)
      if (valid) {
        sessionStorage.setItem(`control_pin_${courtId}`, pin)
        setPinAuthenticated(true)
      } else {
        setPinError('Incorrect PIN')
        setPin('')
      }
    } catch {
      setPinError('Failed to verify PIN')
    }
    setPinLoading(false)
  }

  // Load events
  useEffect(() => {
    if (!venueId || !pinAuthenticated) return

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await callMatchplayEvent({ action: 'list', venue_id: venueId })
        const list = result.events ?? []
        if (list.length > 0) {
          const { data: players } = await supabase
            .from('matchplay_players')
            .select('event_id')
          const counts: Record<string, number> = {}
          for (const p of players ?? []) {
            counts[p.event_id] = (counts[p.event_id] ?? 0) + 1
          }
          const { data: rounds } = await supabase
            .from('matchplay_rounds')
            .select('event_id')
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
        setError('Failed to load events')
      }
      setLoading(false)
    }
    load()
  }, [venueId, pinAuthenticated])

  const activeEvent = events.find((e) => e.status === 'setup' || e.status === 'in_progress')
  const pastEvents = events
    .filter((e) => e.status === 'completed')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  // PIN screen
  if (pinLoading || !pinAuthenticated) {
    return (
      <div className="setup-screen">
        <div className="setup-pin-wrap">
          <SetupScreenHeader />
          <p className="setup-pin-title">Enter 4-digit PIN</p>
          {pinError && <div className="setup-pin-error">{pinError}</div>}
          {error && <div className="setup-pin-error">{error}</div>}
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            className="setup-pin-input"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
              setPinError(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && pin.length === 4 && handlePinSubmit()}
            placeholder="0000"
            autoFocus
            disabled={pinLoading || !!error}
          />
          <button
            type="button"
            className="setup-pin-btn"
            onClick={handlePinSubmit}
            disabled={pin.length !== 4 || pinLoading || !!error}
          >
            {pinLoading ? 'Verifying...' : 'Submit'}
          </button>
        </div>
      </div>
    )
  }

  // State B: Active event in progress
  if (loading) {
    return (
      <div className="matchplay-launcher">
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
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
            Round {(activeEvent.match_count ?? 0) || 1} of {(activeEvent.match_count ?? 0) || 1} · {activeEvent.player_count ?? 0} players
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

  // State A: No active event — game mode cards
  return (
    <div className="matchplay-launcher">
      <h1 className="matchplay-launcher-title">Matchplay</h1>

      <div className="matchplay-mode-cards">
        <Link href="/matchplay/new" className="matchplay-mode-card matchplay-mode-card-active">
          <div className="matchplay-mode-card-content">
            <h2 className="matchplay-mode-name">Americano</h2>
            <p className="matchplay-mode-desc">Everyone plays with everyone once</p>
            <span className="matchplay-mode-badge">Points-based scoring · auto-generated pairings</span>
          </div>
        </Link>

        <div className="matchplay-mode-card matchplay-mode-card-coming">
          <span className="matchplay-coming-badge">COMING SOON</span>
          <div className="matchplay-mode-card-content">
            <h2 className="matchplay-mode-name">King of the Court</h2>
            <p className="matchplay-mode-desc">Elimination-style rotation</p>
          </div>
        </div>

        <div className="matchplay-mode-card matchplay-mode-card-coming">
          <span className="matchplay-coming-badge">COMING SOON</span>
          <div className="matchplay-mode-card-content">
            <h2 className="matchplay-mode-name">Matchplay</h2>
            <p className="matchplay-mode-desc">Curated social play with manual pairings</p>
          </div>
        </div>

        <div className="matchplay-mode-card matchplay-mode-card-coming">
          <span className="matchplay-coming-badge">COMING SOON</span>
          <div className="matchplay-mode-card-content">
            <h2 className="matchplay-mode-name">Mexicano</h2>
            <p className="matchplay-mode-desc">Coming soon</p>
          </div>
        </div>
      </div>

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
