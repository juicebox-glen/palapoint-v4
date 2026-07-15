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
import { StaffAppFrame } from '@/components/venue-screen/StaffAppFrame'
import '@/app/styles/palalive-tokens.css'
import '@/app/styles/palalive-staff.css'
import { staffSocialNightHref } from '@/lib/hooks/useStaffSocialNightPaths'
import {
  fetchStaffModeResumeHints,
  resolveSocialNightResumeEventId,
  type StaffModeResumeHints,
} from '@/lib/venue-screen-resume'

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
  const [modeBusy, setModeBusy] = useState<'social_night' | 'showcase_game' | null>(null)
  const [resumeHints, setResumeHints] = useState<StaffModeResumeHints>({
    socialNightLive: false,
    showcaseLive: false,
  })
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
    if (!selectedScreen) {
      setResumeHints({ socialNightLive: false, showcaseLive: false })
      return
    }

    let cancelled = false
    void fetchStaffModeResumeHints(selectedScreen).then((hints) => {
      if (!cancelled) setResumeHints(hints)
    })

    return () => {
      cancelled = true
    }
  }, [selectedScreen])

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

  const startSocialNight = async () => {
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

    setModeBusy('social_night')
    setFeedback(null)

    const resumeEventId = await resolveSocialNightResumeEventId(selectedScreen)

    setModeBusy(null)
    router.push(
      resumeEventId
        ? staffSocialNightHref(venueSlug, `/${resumeEventId}`)
        : `/staff/${venueSlug}/social-night`
    )
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
    <div className="palalive-staff-shell">
    <StaffAppFrame venueSlug={venueSlug} isHomeScreen>
        <div className="palalive-staff-body">
        {loading ? <p className="palalive-staff-loading-text">Loading…</p> : null}

        {loadError ? <p className="palalive-staff-error">{loadError}</p> : null}

        {!loading && !loadError && selectedScreen ? (
          <>
            {screens.length > 1 ? (
              <div>
                <label className="palalive-staff-label" htmlFor="staff-screen-select">
                  Screen
                </label>
                <select
                  id="staff-screen-select"
                  className="palalive-staff-select"
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

            <div className="palalive-staff-card">
              <span className="palalive-staff-card-label">Current screen</span>
              <span className="palalive-staff-page-title" style={{ margin: 0, fontSize: 20 }}>
                {MODE_LABELS[selectedScreen.active_mode]}
              </span>
              <span className="palalive-staff-card-hint">{selectedScreen.display_name}</span>
            </div>

            {!pairingReady ? (
              <div>
                <label className="palalive-staff-label" htmlFor="staff-pairing">
                  Pairing code
                </label>
                <input
                  id="staff-pairing"
                  type="password"
                  autoComplete="off"
                  className="palalive-staff-input"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  placeholder="Enter venue pairing code"
                />
                <div style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className="palalive-staff-btn palalive-staff-btn--primary"
                    onClick={savePairingCode}
                    disabled={!pairingCode.trim()}
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="palalive-staff-section-label" style={{ marginBottom: 0 }}>
                  What should the venue screen show?
                </p>

                <div className="palalive-staff-list-group">
                  <button
                    type="button"
                    className="palalive-staff-list-row"
                    disabled={busy || modeBusy !== null}
                    onClick={() => void startSocialNight()}
                  >
                    <span className="palalive-staff-list-row-copy">
                      <span className="palalive-staff-list-row-title">
                        {resumeHints.socialNightLive ? 'Continue Social Night' : 'Social Night'}
                      </span>
                      <span className="palalive-staff-list-row-desc">
                        {resumeHints.socialNightLive
                          ? 'Return to the live Americano on screen.'
                          : 'Set up a new Americano and show it on screen.'}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="palalive-staff-list-row"
                    disabled={busy || modeBusy !== null}
                    onClick={startShowcaseGame}
                  >
                    <span className="palalive-staff-list-row-copy">
                      <span className="palalive-staff-list-row-title">
                        {resumeHints.showcaseLive ? 'Continue Showcase Game' : 'Showcase Game'}
                      </span>
                      <span className="palalive-staff-list-row-desc">
                        {resumeHints.showcaseLive
                          ? 'Return to the live showcase match on screen.'
                          : 'Live scoreboard for a single match.'}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="palalive-staff-btn palalive-staff-btn--secondary"
                    disabled={busy}
                    onClick={() => void applyMode('idle')}
                  >
                    Reset to Idle
                  </button>
                </div>
              </>
            )}

            {feedback ? (
              <p className={feedback.kind === 'ok' ? 'palalive-staff-success' : 'palalive-staff-error'}>
                {feedback.text}
              </p>
            ) : null}
          </>
        ) : null}
        </div>
    </StaffAppFrame>
    </div>
  )
}
