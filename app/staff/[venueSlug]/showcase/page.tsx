'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import ControlPanel from '@/components/displays/ControlPanel'
import { StaffFlowHeaderBar, StaffPageShell } from '@/components/venue-screen/StaffPageShell'
import { supabase } from '@/lib/supabase'
import { VENUE_SCREEN_PUBLIC_SELECT } from '@/lib/types/venue-screen'
import { brandingStylesFor, getVenueBrandingForCourtId, type VenueBranding } from '@/lib/venue'
import {
  getVenueScreenStaffContext,
  linkVenueScreenToShowcaseGame,
  resetVenueScreenAfterShowcaseEnd,
} from '@/lib/venue-screen-staff-context'

export default function StaffShowcasePage() {
  const router = useRouter()
  const params = useParams()
  const venueSlug = (params.venueSlug as string | undefined) ?? ''

  const [courtId, setCourtId] = useState<string | null>(null)
  const [branding, setBranding] = useState<VenueBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const ctx = getVenueScreenStaffContext()
      if (!ctx || ctx.venueSlug !== venueSlug) {
        router.replace(`/staff/${venueSlug}`)
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

      setCourtId(data.court_id)
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
      <StaffPageShell venueSlug={venueSlug} wideHeader style={brandingStyles}>
        <p className="staff-muted">Loading…</p>
      </StaffPageShell>
    )
  }

  if (loadError || !courtId) {
    return (
      <StaffPageShell venueSlug={venueSlug} wideHeader style={brandingStyles}>
        <div className="staff-error">
          <p>{loadError ?? 'Court not found for this screen.'}</p>
        </div>
      </StaffPageShell>
    )
  }

  return (
    <div style={brandingStyles}>
      <div className="staff-page">
        <StaffFlowHeaderBar venueSlug={venueSlug} wide />
        {linkError ? (
          <div className="staff-error staff-flow-header-wrap staff-flow-header-wrap--wide">
            <p>{linkError}</p>
          </div>
        ) : null}
      </div>

      <ControlPanel
        courtId={courtId}
        branding={branding}
        courtName={branding?.courtName}
        showSetupHeader={false}
        onMatchStarted={handleMatchStarted}
        onMatchEnded={handleMatchEnded}
      />
    </div>
  )
}
