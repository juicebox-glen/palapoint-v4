'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import { getMatchplayVenueId } from '@/lib/supabase'
import '@/app/styles/setup-form.css'

function SetupPhotoSlotIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="setup-photo-trigger-svg"
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SETTINGS_KEY = 'palapoint_matchplay_settings'

interface MatchplaySettings {
  courtCount: number
  maxScore: number
  maxScoreCustom?: number
  rounds: number
  roundsCustom?: number
}

function loadSettings(): MatchplaySettings | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) return JSON.parse(stored) as MatchplaySettings
  } catch {}
  return null
}

function generateEventName(): string {
  const d = new Date()
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} Americano`
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

async function callMatchplayPlayer(body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/matchplay-player`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

export default function MatchplayNewPlayersPage() {
  const router = useRouter()
  const [venueId, setVenueId] = useState<string | null>(null)
  const [players, setPlayers] = useState<string[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const vid = await getMatchplayVenueId()
      setVenueId(vid)
      const settings = loadSettings()
      if (!settings) {
        router.replace('/matchplay/new')
        return
      }
      setLoading(false)
    }
    init()
  }, [router])

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    setPlayers((prev) => [...prev, name])
    setNewName('')
    inputRef.current?.focus()
  }

  function handleRemove(index: number) {
    setPlayers((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleStartEvent() {
    const settings = loadSettings()
    if (!venueId || !settings || players.length < 4) return

    setStarting(true)
    setError(null)

    try {
      const maxScore = settings.maxScore === 0 ? (settings.maxScoreCustom ?? 32) : settings.maxScore
      const courtLabels = Array.from({ length: settings.courtCount }, (_, i) => `Court ${i + 1}`)

      const body: Record<string, unknown> = {
        action: 'create',
        venue_id: venueId,
        name: generateEventName(),
        format: 'americano',
        scoring_type: 'raw_points',
        court_count: settings.courtCount,
        court_labels: courtLabels,
        match_format: 'first_to_points',
        match_target_score: maxScore,
        win_points: 0,
        draw_points: 0,
        loss_points: 0,
      }

      const createResult = await callMatchplayEvent(body)
      if (!createResult.event) {
        setError(createResult.error || 'Failed to create event')
        setStarting(false)
        return
      }

      const eventId = createResult.event.id
      const addResult = await callMatchplayPlayer({ action: 'add_bulk', event_id: eventId, names: players })
      if (addResult.error && !addResult.players) {
        setError(addResult.error || 'Failed to add players')
        setStarting(false)
        return
      }

      router.push(`/matchplay/${eventId}`)
    } catch (err) {
      setError('Failed to start event')
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="matchplay-players-page">
        <SetupScreenHeader />
        <p className="matchplay-loading-text">Loading...</p>
      </div>
    )
  }

  const canStart = players.length >= 4

  return (
    <div className="matchplay-players-page">
      <SetupScreenHeader />
      <div className="matchplay-players-header">
        <Link href="/matchplay/new" className="matchplay-players-back">
          ← Back
        </Link>
        <h1 className="matchplay-players-title">Players</h1>
        <span className="matchplay-players-count">{players.length} added</span>
      </div>

      <div className="setup-inputs matchplay-players-list">
        <div className="setup-player-row">
          <div className="setup-photo-circle-wrap" aria-hidden>
            <div className="setup-photo-trigger setup-photo-trigger--static" role="presentation">
              <SetupPhotoSlotIcon />
            </div>
          </div>
          <div className="setup-input-wrap setup-input-wrap--player-name">
            <input
              ref={inputRef}
              type="text"
              className="setup-input"
              placeholder="Enter name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary matchplay-players-add"
            onClick={handleAdd}
            disabled={!newName.trim()}
          >
            ADD
          </button>
        </div>

        {players.map((name, i) => (
          <div key={`${name}-${i}`} className="setup-player-row">
            <div className="setup-photo-circle-wrap" aria-hidden>
              <div className="setup-photo-trigger setup-photo-trigger--static" role="presentation">
                <SetupPhotoSlotIcon />
              </div>
            </div>
            <div className="setup-input-wrap setup-input-wrap--player-name">
              <input type="text" className="setup-input" readOnly value={name} aria-label={name} />
            </div>
            <button
              type="button"
              className="matchplay-players-remove"
              onClick={() => handleRemove(i)}
              aria-label={`Remove ${name}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {error && <div className="setup-error matchplay-error-text">{error}</div>}

      <div className="matchplay-players-footer">
        <button
          type="button"
          className="btn btn-primary matchplay-players-start"
          onClick={handleStartEvent}
          disabled={!canStart || starting}
        >
          {starting ? 'Starting...' : 'START EVENT'}
        </button>
        {!canStart && (
          <p className="matchplay-players-hint">Add at least 4 players to start</p>
        )}
        {canStart && players.length % 4 !== 0 && (
          <p className="matchplay-players-hint">Americano works best with multiples of 4 (8, 12, 16 players)</p>
        )}
      </div>
    </div>
  )
}
