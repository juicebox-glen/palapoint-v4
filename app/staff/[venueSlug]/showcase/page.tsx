'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import ControlPanel from '@/components/displays/ControlPanel'
import { StaffAppFrame } from '@/components/venue-screen/StaffAppFrame'
import { supabase } from '@/lib/supabase'
import { VENUE_SCREEN_PUBLIC_SELECT } from '@/lib/types/venue-screen'
import { brandingStylesFor, getVenueBrandingForCourtId, type VenueBranding } from '@/lib/venue'
import {
  getVenueScreenStaffContext,
  linkVenueScreenToShowcaseGame,
  resetVenueScreenAfterShowcaseEnd,
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

  const handleMatchStarted = useCallback(async (matchId: string) => {
    setLinkError(null)
    const result = await linkVenueScreenToShowcaseGame(matchId)
    if (!result.ok) {
      setLinkError(result.error ?? 'Could not link the venue screen.')
    }
  }, [])

  const handleMatchEnded = useCallback(async (matchId: string) => {
    await resetVenueScreenAfterShowcaseEnd(matchId)
  }, [])

  const brandingStyles = brandingStylesFor(branding)

  if (loading) {
    return (
      <StaffAppFrame venueSlug={venueSlug} style={brandingStyles}>
        <p className="staff-muted">Loading…</p>
      </StaffAppFrame>
    )
  }

  if (loadError || !courtId) {
    return (
      <StaffAppFrame venueSlug={venueSlug} style={brandingStyles}>
        <div className="staff-error">
          <p>{loadError ?? 'Court not found for this screen.'}</p>
        </div>
      </StaffAppFrame>
    )
  }

  return (
    <StaffAppFrame venueSlug={venueSlug} style={brandingStyles}>
      {linkError ? (
        <div className="staff-error">
          <p>{linkError}</p>
        </div>
      ) : null}

      <ControlPanel
        courtId={courtId}
        resumeMatchId={resumeMatchId}
        branding={branding}
        courtName={branding?.courtName}
        showSetupHeader={false}
        embedded
        onMatchStarted={handleMatchStarted}
        onMatchEnded={handleMatchEnded}
      />
    </StaffAppFrame>
  )
}
