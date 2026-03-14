'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getMatchplayVenueId } from '@/lib/supabase'
import '@/app/styles/setup-form.css'

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

const DEFAULT_SETTINGS: MatchplaySettings = {
  courtCount: 2,
  maxScore: 32,
  rounds: 4,
}

function loadSettings(): MatchplaySettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<MatchplaySettings>
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {}
  return DEFAULT_SETTINGS
}

function saveSettings(s: MatchplaySettings) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch {}
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

function getEventSummary(courtCount: number, rounds: number, maxScore: number) {
  const courts = Math.max(1, courtCount)
  const totalMatches = rounds * courts
  const avgMatchMins = maxScore <= 16 ? 8 : maxScore <= 24 ? 10 : 12
  const estDurationMins = totalMatches * avgMatchMins
  const hours = Math.floor(estDurationMins / 60)
  const mins = estDurationMins % 60
  const durationStr = hours > 0 ? `~${hours}h ${mins}m` : `~${mins}m`
  return {
    totalMatches,
    estimatedDuration: durationStr,
  }
}

export default function MatchplayNewPage() {
  const router = useRouter()
  const [venueId, setVenueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<MatchplaySettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    async function init() {
      const vid = await getMatchplayVenueId()
      setVenueId(vid)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!venueId || loading) return

    async function prefill() {
      const result = await callMatchplayEvent({ action: 'list', venue_id: venueId })
      const events = (result.events ?? []).filter((e: { status: string }) => e.status === 'completed')
      const americanoEvents = events.filter((e: { format?: string }) => e.format === 'americano')
      const latest = americanoEvents.sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      if (latest) {
        setSettings({
          courtCount: latest.court_count ?? DEFAULT_SETTINGS.courtCount,
          maxScore: latest.match_target_score ?? DEFAULT_SETTINGS.maxScore,
          rounds: 4,
        })
      } else {
        const saved = loadSettings()
        setSettings(saved)
      }
    }
    prefill()
  }, [venueId, loading])

  function handleContinue() {
    const toSave: MatchplaySettings = {
      ...settings,
      maxScore: settings.maxScore === 0 ? (settings.maxScoreCustom ?? 32) : settings.maxScore,
      maxScoreCustom: settings.maxScore === 0 ? settings.maxScoreCustom : undefined,
      rounds: settings.rounds === 0 ? (settings.roundsCustom ?? 4) : settings.rounds,
      roundsCustom: settings.rounds === 0 ? settings.roundsCustom : undefined,
    }
    saveSettings(toSave)
    router.push('/matchplay/new/players')
  }

  const effectiveMaxScore = settings.maxScore === 0 ? (settings.maxScoreCustom ?? 32) : settings.maxScore
  const effectiveRounds = settings.rounds === 0 ? (settings.roundsCustom ?? 4) : settings.rounds
  const summary = getEventSummary(settings.courtCount, effectiveRounds, effectiveMaxScore)
  const courts = Math.max(1, settings.courtCount)

  if (loading) {
    return (
      <div className="matchplay-format-page">
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="matchplay-format-page">
      <div className="matchplay-format-header">
        <Link href="/matchplay" className="matchplay-format-back">
          ← Back
        </Link>
        <h1 className="matchplay-format-title">Format Setup</h1>
      </div>

      <div className="matchplay-format-form">
        <div className="matchplay-format-section">
          <label className="matchplay-format-label">Courts</label>
          <div className="matchplay-pill-row">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                className={`matchplay-pill ${settings.courtCount === n ? 'active' : ''}`}
                onClick={() => setSettings((s) => ({ ...s, courtCount: n }))}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="matchplay-format-section">
          <label className="matchplay-format-label">Points per match</label>
          <p className="matchplay-format-hint" style={{ marginBottom: '0.5rem' }}>
            Total points per match. Scores always sum to this number.
          </p>
          <div className="matchplay-pill-row">
            {[16, 24, 32].map((n) => (
              <button
                key={n}
                type="button"
                className={`matchplay-pill ${settings.maxScore === n ? 'active' : ''}`}
                onClick={() => setSettings((s) => ({ ...s, maxScore: n }))}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className={`matchplay-pill ${settings.maxScore === 0 ? 'active' : ''}`}
              onClick={() => setSettings((s) => ({ ...s, maxScore: 0 }))}
            >
              Custom
            </button>
          </div>
          {settings.maxScore === 0 && (
            <div className="matchplay-format-sub">
              <input
                type="number"
                className="input"
                min={8}
                max={64}
                value={settings.maxScoreCustom ?? 32}
                onChange={(e) => setSettings((s) => ({ ...s, maxScoreCustom: Number(e.target.value) || 32 }))}
              />
            </div>
          )}
        </div>

        <div className="matchplay-format-section">
          <label className="matchplay-format-label">Rounds</label>
          <div className="matchplay-pill-row">
            {[3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                className={`matchplay-pill ${settings.rounds === n ? 'active' : ''}`}
                onClick={() => setSettings((s) => ({ ...s, rounds: n }))}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className={`matchplay-pill ${settings.rounds === 0 ? 'active' : ''}`}
              onClick={() => setSettings((s) => ({ ...s, rounds: 0 }))}
            >
              Custom
            </button>
          </div>
          {settings.rounds === 0 && (
            <div className="matchplay-format-sub">
              <input
                type="number"
                className="input"
                min={1}
                max={20}
                value={settings.roundsCustom ?? 4}
                onChange={(e) => setSettings((s) => ({ ...s, roundsCustom: Number(e.target.value) || 4 }))}
              />
            </div>
          )}
          <p className="matchplay-format-hint">Guide — Americano generates rounds so everyone partners with everyone</p>
        </div>

        <div className="matchplay-format-section matchplay-event-summary">
          <label className="matchplay-format-label">Event Summary</label>
          <div className="matchplay-summary-panel">
            <p>Matches per player: Add players to see full estimate</p>
            <p>Total matches: {summary.totalMatches}</p>
            <p>Estimated duration: {summary.estimatedDuration}</p>
            <p className="matchplay-summary-based">
              Based on {courts} court{courts !== 1 ? 's' : ''} · {effectiveRounds} rounds · {effectiveMaxScore} pts per match
            </p>
          </div>
        </div>
      </div>

      <div className="matchplay-format-footer">
        <button type="button" className="btn btn-primary matchplay-format-continue" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  )
}
