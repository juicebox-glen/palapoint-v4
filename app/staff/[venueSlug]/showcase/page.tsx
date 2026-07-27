'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import ControlPanel from '@/components/displays/ControlPanel'
import { StaffAppFrame } from '@/components/venue-screen/StaffAppFrame'
import { supabase } from '@/lib/supabase'
import { supabaseFunctionHeaders, SUPABASE_URL } from '@/lib/api/supabase-functions'
import { VENUE_SCREEN_PUBLIC_SELECT } from '@/lib/types/venue-screen'
import { palaLiveBrandingStylesFor, getVenueBrandingForCourtId, type VenueBranding } from '@/lib/venue'
import {
  getVenueScreenStaffContext,
  linkVenueScreenToShowcaseGame,
  resetVenueScreenAfterShowcaseEnd,
  scheduleShowcaseScreenIdleReset,
} from '@/lib/venue-screen-staff-context'
import { resolveShowcaseResumeMatchId } from '@/lib/venue-screen-resume'

export default function StaffShowcasePage() {
  const router = useRouter()
  const params = useParams()
  const venueSlug = (params.venueSlug as string | undefined) ?? ''

  const [courtId, setCourtId] = useState<string | null>(null)
  const [resumeMatchId, setResumeMatchId] = useState<string | null>(null)
  const [branding, setBranding] = useState<VenueBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  // Set only for a match created-but-not-started this session — lets Back unwind it
  // (unlink + abandon) instead of leaving an orphaned 'setup' row and a stuck display.
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const ctx = getVenueScreenStaffContext()
      if (!ctx || ctx.venueSlug !== venueSlug) {
        if (!cancelled) {
          setLoading(false)
          router.replace(`/staff/${venueSlug}`)
        }
        return
      }

      const { data, error } = await supabase
        .from('venue_screens')
        .select(VENUE_SCREEN_PUBLIC_SELECT)
        .eq('screen_slug', ctx.screenSlug)
        .maybeSingle()

      if (cancelled) return

      if (error || !data?.court_id) {
        setLoadError(
          error?.message ?? 'This screen is not configured for showcase scoring.'
        )
        setLoading(false)
        return
      }

      const brand = await getVenueBrandingForCourtId(data.court_id)
      if (cancelled) return

      const showcaseMatchId = await resolveShowcaseResumeMatchId(data)

      setCourtId(data.court_id)
      setResumeMatchId(showcaseMatchId)
      setBranding(brand)
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [router, venueSlug])

  /** Confirmation screen mounted — a real 'setup'-status match now exists with everything
   *  the build-up display needs (players, photos, game mode, format, court). Link now,
   *  not at Start, so the venue display switches here instead of when scoring begins. */
  const handleMatchReady = useCallback(async (matchId: string) => {
    setLinkError(null)
    setPendingMatchId(matchId)
    const result = await linkVenueScreenToShowcaseGame(matchId)
    if (!result.ok) {
      setLinkError(result.error ?? 'Could not link the venue screen.')
    }
  }, [])

  /** Match has gone live — no longer cancellable via Back, so stop treating it as pending. */
  const handleMatchStarted = useCallback(() => {
    setPendingMatchId(null)
  }, [])

  const handleMatchEnded = useCallback((matchId: string) => {
    scheduleShowcaseScreenIdleReset(matchId)
  }, [])

  /** Back from the confirmation screen: unwind a not-yet-started match (unlink the
   *  display, mark the match abandoned so it can't be silently resumed later) instead
   *  of just navigating away and leaving the display stuck on it. */
  const goBackToStaffHome = useCallback(async () => {
    if (!pendingMatchId) {
      router.push(`/staff/${venueSlug}`)
      return
    }

    setIsCancelling(true)
    setLinkError(null)

    const unlinkResult = await resetVenueScreenAfterShowcaseEnd(pendingMatchId).catch((err) => ({
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to reset venue display',
    }))
    if (!unlinkResult.ok) {
      setLinkError(unlinkResult.error || 'Failed to reset venue display — try Back again.')
      setIsCancelling(false)
      return
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: supabaseFunctionHeaders(),
        body: JSON.stringify({ action: 'end', court_id: courtId, reason: 'abandoned' }),
      })
      const data = await response.json()
      if (!data.success) {
        setLinkError(data.error || 'Failed to cancel match — try Back again.')
        setIsCancelling(false)
        return
      }
    } catch (err) {
      console.error('Error cancelling match:', err)
      setLinkError('Failed to cancel match — try Back again.')
      setIsCancelling(false)
      return
    }

    setPendingMatchId(null)
    setIsCancelling(false)
    router.push(`/staff/${venueSlug}`)
  }, [pendingMatchId, courtId, router, venueSlug])

  const brandingStyles = palaLiveBrandingStylesFor(branding)

  const frameProps = {
    venueSlug,
    onBack: () => {
      if (isCancelling) return
      void goBackToStaffHome()
    },
    style: brandingStyles,
  } as const

  if (loading) {
    return (
      <StaffAppFrame {...frameProps}>
        <p className="palalive-staff-loading-text">Loading…</p>
      </StaffAppFrame>
    )
  }

  if (loadError || !courtId) {
    return (
      <StaffAppFrame {...frameProps}>
        <p className="palalive-staff-error">{loadError ?? 'Court not found for this screen.'}</p>
      </StaffAppFrame>
    )
  }

  return (
    <StaffAppFrame {...frameProps}>
      {linkError ? <p className="palalive-staff-error">{linkError}</p> : null}

      <ControlPanel
        courtId={courtId}
        resumeMatchId={resumeMatchId}
        freshEntryActiveOnly={resumeMatchId == null}
        branding={branding}
        courtName={branding?.courtName}
        showSetupHeader={false}
        embedded
        variant="palalive-staff"
        onMatchReady={handleMatchReady}
        onMatchStarted={handleMatchStarted}
        onMatchEnded={handleMatchEnded}
      />
    </StaffAppFrame>
  )
}
