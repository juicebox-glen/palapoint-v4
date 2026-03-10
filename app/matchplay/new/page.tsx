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
  matchFormat: 'timed' | 'first_to_points'
  matchDuration: number
  matchTarget: number
  gameMode: 'golden_point' | 'silver_point' | 'traditional'
  winPoints: number
  drawPoints: number
  lossPoints: number
  rounds: number
  roundsCustom?: number
}

const DEFAULT_SETTINGS: MatchplaySettings = {
  courtCount: 2,
  matchFormat: 'timed',
  matchDuration: 10,
  matchTarget: 9,
  gameMode: 'golden_point',
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  rounds: 3,
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
      const latest = events.sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      if (latest) {
        setSettings({
          courtCount: latest.court_count ?? DEFAULT_SETTINGS.courtCount,
          matchFormat: (latest.match_format === 'first_to_points' ? 'first_to_points' : 'timed') as 'timed' | 'first_to_points',
          matchDuration: latest.match_duration_minutes ?? DEFAULT_SETTINGS.matchDuration,
          matchTarget: latest.match_target_score ?? DEFAULT_SETTINGS.matchTarget,
          gameMode: (latest.game_mode || DEFAULT_SETTINGS.gameMode) as MatchplaySettings['gameMode'],
          winPoints: latest.win_points ?? DEFAULT_SETTINGS.winPoints,
          drawPoints: latest.draw_points ?? DEFAULT_SETTINGS.drawPoints,
          lossPoints: latest.loss_points ?? DEFAULT_SETTINGS.lossPoints,
          rounds: DEFAULT_SETTINGS.rounds,
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
      rounds: settings.rounds === 0 ? 3 : settings.rounds,
      roundsCustom: settings.rounds === 0 ? settings.roundsCustom : undefined,
    }
    saveSettings(toSave)
    router.push('/matchplay/new/players')
  }

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
          <label className="matchplay-format-label">Match Format</label>
          <div className="matchplay-pill-row">
            <button
              type="button"
              className={`matchplay-pill ${settings.matchFormat === 'timed' ? 'active' : ''}`}
              onClick={() => setSettings((s) => ({ ...s, matchFormat: 'timed' }))}
            >
              Timed
            </button>
            <button
              type="button"
              className={`matchplay-pill ${settings.matchFormat === 'first_to_points' ? 'active' : ''}`}
              onClick={() => setSettings((s) => ({ ...s, matchFormat: 'first_to_points' }))}
            >
              First to X
            </button>
          </div>
          {settings.matchFormat === 'timed' && (
            <div className="matchplay-format-sub">
              <label className="matchplay-format-sublabel">Duration (minutes)</label>
              <input
                type="number"
                className="input"
                min={5}
                max={60}
                value={settings.matchDuration}
                onChange={(e) => setSettings((s) => ({ ...s, matchDuration: Number(e.target.value) || 10 }))}
              />
            </div>
          )}
          {settings.matchFormat === 'first_to_points' && (
            <div className="matchplay-format-sub">
              <label className="matchplay-format-sublabel">Target Score</label>
              <input
                type="number"
                className="input"
                min={5}
                max={15}
                value={settings.matchTarget}
                onChange={(e) => setSettings((s) => ({ ...s, matchTarget: Number(e.target.value) || 9 }))}
              />
            </div>
          )}
        </div>

        <div className="matchplay-format-section">
          <label className="matchplay-format-label">Deuce Rule</label>
          <div className="matchplay-pill-row">
            <button
              type="button"
              className={`matchplay-pill ${settings.gameMode === 'golden_point' ? 'active' : ''}`}
              onClick={() => setSettings((s) => ({ ...s, gameMode: 'golden_point' }))}
            >
              Golden
            </button>
            <button
              type="button"
              className={`matchplay-pill ${settings.gameMode === 'silver_point' ? 'active' : ''}`}
              onClick={() => setSettings((s) => ({ ...s, gameMode: 'silver_point' }))}
            >
              Silver
            </button>
            <button
              type="button"
              className={`matchplay-pill ${settings.gameMode === 'traditional' ? 'active' : ''}`}
              onClick={() => setSettings((s) => ({ ...s, gameMode: 'traditional' }))}
            >
              Traditional
            </button>
          </div>
        </div>

        <div className="matchplay-format-section">
          <label className="matchplay-format-label">Points</label>
          <div className="matchplay-points-row">
            <span>Win</span>
            <input
              type="number"
              className="input matchplay-point-input"
              min={0}
              max={10}
              value={settings.winPoints}
              onChange={(e) => setSettings((s) => ({ ...s, winPoints: Number(e.target.value) || 0 }))}
            />
            <span>·</span>
            <span>Draw</span>
            <input
              type="number"
              className="input matchplay-point-input"
              min={0}
              max={5}
              value={settings.drawPoints}
              onChange={(e) => setSettings((s) => ({ ...s, drawPoints: Number(e.target.value) || 0 }))}
            />
            <span>·</span>
            <span>Loss</span>
            <input
              type="number"
              className="input matchplay-point-input"
              min={0}
              max={5}
              value={settings.lossPoints}
              onChange={(e) => setSettings((s) => ({ ...s, lossPoints: Number(e.target.value) || 0 }))}
            />
          </div>
        </div>

        <div className="matchplay-format-section">
          <label className="matchplay-format-label">Rounds</label>
          <div className="matchplay-pill-row">
            {[3, 4, 5].map((n) => (
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
                value={settings.roundsCustom ?? 3}
                onChange={(e) => setSettings((s) => ({ ...s, roundsCustom: Number(e.target.value) || 3 }))}
              />
            </div>
          )}
          <p className="matchplay-format-hint">Guide — you can add more or finish early</p>
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
