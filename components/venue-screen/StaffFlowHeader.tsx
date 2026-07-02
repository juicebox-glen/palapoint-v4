'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { VenueLogo } from '@/components/shared/VenueLogo'
import { useMatchplaySetupBranding } from '@/lib/hooks/useMatchplaySetupBranding'
import type { MatchplayVenueHeaderBranding } from '@/lib/supabase'
import {
  DEFAULT_TEAM_A_COLOR,
  DEFAULT_TEAM_B_COLOR,
  type VenueBranding,
} from '@/lib/venue'
import {
  getVenueScreenStaffContext,
  type VenueScreenStaffContext,
} from '@/lib/venue-screen-staff-context'

import '@/app/styles/setup-form.css'

interface StaffFlowHeaderProps {
  /** On /staff — logo is inert (already home). */
  isHomeScreen?: boolean
  /** Override venue slug (e.g. from route params on /staff). */
  venueSlug?: string
}

function brandingForLogo(
  matchplayBranding: MatchplayVenueHeaderBranding | null
): VenueBranding | null {
  if (!matchplayBranding) return null
  return {
    companyName: matchplayBranding.companyName,
    companySlug: '',
    venueName: matchplayBranding.venueName,
    venueSlug: '',
    courtNumber: 0,
    courtName: '',
    courtId: '',
    isShowCourt: false,
    primaryColor: matchplayBranding.primaryColor ?? DEFAULT_TEAM_A_COLOR,
    secondaryColor: matchplayBranding.secondaryColor ?? DEFAULT_TEAM_B_COLOR,
    logoUrl: matchplayBranding.logoUrl,
  }
}

export function StaffFlowHeader({ isHomeScreen = false, venueSlug }: StaffFlowHeaderProps) {
  const matchplayBranding = useMatchplaySetupBranding()
  const [staffCtx, setStaffCtx] = useState<VenueScreenStaffContext | null>(null)

  useEffect(() => {
    setStaffCtx(getVenueScreenStaffContext())
  }, [])

  const resolvedVenueSlug = venueSlug ?? staffCtx?.venueSlug ?? null
  const homeHref =
    !isHomeScreen && resolvedVenueSlug ? `/staff/${resolvedVenueSlug}` : null

  const logoBranding = useMemo(() => brandingForLogo(matchplayBranding), [matchplayBranding])

  const logo = <VenueLogo branding={logoBranding} />

  return (
    <header className="setup-header">
      <div className="setup-header-left">
        {homeHref ? (
          <Link
            href={homeHref}
            className="staff-flow-home-link"
            aria-label="Back to PalaPoint Live home"
          >
            {logo}
          </Link>
        ) : (
          logo
        )}
      </div>
    </header>
  )
}
