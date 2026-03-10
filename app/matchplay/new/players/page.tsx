'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getMatchplayVenueId } from '@/lib/supabase'
import '@/app/styles/setup-form.css'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SETTINGS_KEY = 'palapoint_matchplay_settings'

interface MatchplaySettings {
  courtCount: number
  matchFormat: 'timed' | 'first_to_points'
  matchDuration: number
  matchTarget: number
  gameMode: string
  winPoints: number
  drawPoints: number
  lossPoints: number
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
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} Matchplay`
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
      const body: Record<string, unknown> = {
        action: 'create',
        venue_id: venueId,
        name: generateEventName(),
        court_count: settings.courtCount,
        match_format: settings.matchFormat,
        game_mode: settings.gameMode,
        win_points: settings.winPoints,
        draw_points: settings.drawPoints,
        loss_points: settings.lossPoints,
      }
      if (settings.matchFormat === 'timed') {
        body.match_duration_minutes = settings.matchDuration
      } else {
        body.match_target_score = settings.matchTarget
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
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    )
  }

  const canStart = players.length >= 4

  return (
    <div className="matchplay-players-page">
      <div className="matchplay-players-header">
        <Link href="/matchplay/new" className="matchplay-players-back">
          ← Back
        </Link>
        <h1 className="matchplay-players-title">Players</h1>
        <span className="matchplay-players-count">{players.length} added</span>
      </div>

      <div className="matchplay-players-input-wrap">
        <input
          ref={inputRef}
          type="text"
          className="input matchplay-players-input"
          placeholder="Enter name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          type="button"
          className="btn btn-primary matchplay-players-add"
          onClick={handleAdd}
          disabled={!newName.trim()}
        >
          ADD
        </button>
      </div>

      <div className="matchplay-players-list">
        {players.map((name, i) => (
          <div key={`${name}-${i}`} className="matchplay-players-row">
            <span className="matchplay-players-name">{name}</span>
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

      {error && <div className="setup-error" style={{ marginTop: '1rem' }}>{error}</div>}

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
      </div>
    </div>
  )
}
