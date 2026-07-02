'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

import { setVenueScreenMode } from '@/lib/api/screen'
import { supabase } from '@/lib/supabase'
import type { VenueScreen, VenueScreenMode } from '@/lib/types/venue-screen'
import { VENUE_SCREEN_PUBLIC_SELECT } from '@/lib/types/venue-screen'
import {
  pairingStorageKey,
  saveVenueScreenStaffContext,
} from '@/lib/venue-screen-staff-context'
import { StaffFlowHeader } from '@/components/venue-screen/StaffFlowHeader'

import '@/app/styles/staff-controller.css'

const MODE_LABELS: Record<VenueScreenMode, string> = {
  idle: 'Idle',
  social_night: 'Social Night',
  showcase_game: 'Showcase Game',
}

export default function StaffPage() {
  const router = useRouter()
  const params = useParams()
  const venueSlug = (params.venueSlug as string | undefined) ?? ''
  const searchParams = useSearchParams()

  const [screens, setScreens] = useState<VenueScreen[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState('')
  const [pairingReady, setPairingReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null
  )

  const selectedScreen = useMemo(
    () => screens.find((s) => s.screen_slug === selectedSlug) ?? screens[0] ?? null,
    [screens, selectedSlug]
  )

  const loadScreens = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    const { data, error } = await supabase
      .from('venue_screens')
      .select(VENUE_SCREEN_PUBLIC_SELECT)
      .eq('venue_slug', venueSlug)
      .order('display_name')

    if (error) {
      setLoadError(error.message)
      setScreens([])
    } else if (!data?.length) {
      setLoadError('No screens configured for this venue.')
      setScreens([])
    } else {
      setScreens(data as VenueScreen[])
      setSelectedSlug((prev) => prev ?? data[0]!.screen_slug)
    }

    setLoading(false)
  }, [venueSlug])

  useEffect(() => {
    void loadScreens()
  }, [loadScreens])

  useEffect(() => {
    const fromUrl = searchParams.get('code')?.trim()
    const stored =
      typeof window !== 'undefined'
        ? sessionStorage.getItem(pairingStorageKey(venueSlug))?.trim()
        : null
    const code = fromUrl || stored || ''
    if (code) {
      setPairingCode(code)
      setPairingReady(true)
      if (fromUrl) {
        sessionStorage.setItem(pairingStorageKey(venueSlug), fromUrl)
      }
    }
  }, [venueSlug, searchParams])

  const savePairingCode = () => {
    const trimmed = pairingCode.trim()
    if (!trimmed) return
    sessionStorage.setItem(pairingStorageKey(venueSlug), trimmed)
    setPairingReady(true)
    setFeedback(null)
  }

  const applyMode = async (active_mode: VenueScreenMode) => {
    if (!selectedScreen) return
    if (!pairingCode.trim()) {
      setFeedback({ kind: 'err', text: 'Enter a pairing code first.' })
      return
    }

    setBusy(true)
    setFeedback(null)

    const result = await setVenueScreenMode({
      screen_slug: selectedScreen.screen_slug,
      pairing_code: pairingCode.trim(),
      active_mode,
    })

    setBusy(false)

    if (!result.success) {
      setFeedback({
        kind: 'err',
        text: result.message ?? result.error,
      })
      return
    }

    setScreens((prev) =>
      prev.map((s) => (s.screen_slug === result.screen.screen_slug ? result.screen : s))
    )
    setFeedback({
      kind: 'ok',
      text: `Screen is now ${MODE_LABELS[result.screen.active_mode]}.`,
    })
  }

  const startSocialNight = () => {
    if (!selectedScreen) return
    if (!pairingCode.trim()) {
      setFeedback({ kind: 'err', text: 'Enter a pairing code first.' })
      return
    }

    saveVenueScreenStaffContext({
      venueSlug,
      screenSlug: selectedScreen.screen_slug,
      pairingCode: pairingCode.trim(),
    })

    const qs = new URLSearchParams({
      venue: venueSlug,
      screen: selectedScreen.screen_slug,
    })
    router.push(`/matchplay?${qs.toString()}`)
  }

  const startShowcaseGame = () => {
    if (!selectedScreen) return
    if (!pairingCode.trim()) {
      setFeedback({ kind: 'err', text: 'Enter a pairing code first.' })
      return
    }

    saveVenueScreenStaffContext({
      venueSlug,
      screenSlug: selectedScreen.screen_slug,
      pairingCode: pairingCode.trim(),
    })

    router.push(`/staff/${venueSlug}/showcase`)
  }

  return (
    <div className="staff-page">
      <div className="staff-shell">
        <StaffFlowHeader isHomeScreen venueSlug={venueSlug} />

        {loading ? <p className="staff-muted">Loading…</p> : null}

        {loadError ? (
          <div className="staff-error">
            <p>{loadError}</p>
          </div>
        ) : null}

        {!loading && !loadError && selectedScreen ? (
          <>
            {screens.length > 1 ? (
              <div className="staff-screen-picker">
                <label className="staff-muted" htmlFor="staff-screen-select">
                  Screen
                </label>
                <select
                  id="staff-screen-select"
                  value={selectedScreen.screen_slug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                >
                  {screens.map((s) => (
                    <option key={s.screen_slug} value={s.screen_slug}>
                      {s.display_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="staff-status">
              <p className="staff-status-label">Current screen</p>
              <p className="staff-status-value">
                {MODE_LABELS[selectedScreen.active_mode]}
              </p>
              <p className="staff-muted">{selectedScreen.display_name}</p>
            </div>

            {!pairingReady ? (
              <div className="staff-pairing-form">
                <label htmlFor="staff-pairing">Pairing code</label>
                <input
                  id="staff-pairing"
                  type="password"
                  autoComplete="off"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  placeholder="Enter venue pairing code"
                />
                <button
                  type="button"
                  className="staff-action"
                  onClick={savePairingCode}
                  disabled={!pairingCode.trim()}
                >
                  <span className="staff-action-title">Continue</span>
                </button>
              </div>
            ) : (
              <>
                <p className="staff-prompt">What should the venue screen show?</p>

                <div className="staff-actions">
                  <button
                    type="button"
                    className="staff-action"
                    disabled={busy}
                    onClick={startSocialNight}
                  >
                    <span className="staff-action-title">Social Night</span>
                    <span className="staff-action-desc">
                      Set up a new Americano and show it on screen.
                    </span>
                  </button>

                  <button
                    type="button"
                    className="staff-action"
                    disabled={busy}
                    onClick={startShowcaseGame}
                  >
                    <span className="staff-action-title">Showcase Game</span>
                    <span className="staff-action-desc">
                      Live scoreboard for a single match.
                    </span>
                  </button>

                  <button
                    type="button"
                    className="staff-action staff-action--secondary"
                    disabled={busy}
                    onClick={() => void applyMode('idle')}
                  >
                    Reset to Idle
                  </button>
                </div>
              </>
            )}

            {feedback ? (
              <p
                className={`staff-feedback staff-feedback--${feedback.kind === 'ok' ? 'ok' : 'err'}`}
              >
                {feedback.text}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
