'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { VenueLogo } from '@/components/shared/VenueLogo'
import { StaffBackArrowIcon } from '@/components/venue-screen/StaffBackArrowIcon'
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

export interface StaffFlowHeaderProps {
  /** On /staff home — logo only, no back control. */
  isHomeScreen?: boolean
  /** Override venue slug (e.g. from route params on /staff). */
  venueSlug?: string
  /** Custom back action (e.g. router.back()). */
  onBack?: () => void
  /** Link-based back (overrides default staff-home link). */
  backHref?: string
  /** Right slot — event hub menu, etc. */
  headerRight?: ReactNode
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

export function StaffFlowHeader({
  isHomeScreen = false,
  venueSlug,
  onBack,
  backHref,
  headerRight,
}: StaffFlowHeaderProps) {
  const matchplayBranding = useMatchplaySetupBranding()
  const [staffCtx, setStaffCtx] = useState<VenueScreenStaffContext | null>(null)

  useEffect(() => {
    setStaffCtx(getVenueScreenStaffContext())
  }, [])

  const resolvedVenueSlug = venueSlug ?? staffCtx?.venueSlug ?? null
  const defaultBackHref =
    !isHomeScreen && resolvedVenueSlug ? `/staff/${resolvedVenueSlug}` : null
  const resolvedBackHref = backHref ?? defaultBackHref
  const showBack = !isHomeScreen && (onBack != null || resolvedBackHref != null)

  const logoBranding = useMemo(() => brandingForLogo(matchplayBranding), [matchplayBranding])
  const logo = <VenueLogo branding={logoBranding} />

  const backControl =
    onBack != null ? (
      <button type="button" className="staff-flow-back" onClick={onBack} aria-label="Back">
        <StaffBackArrowIcon />
      </button>
    ) : resolvedBackHref ? (
      <Link href={resolvedBackHref} className="staff-flow-back" aria-label="Back">
        <StaffBackArrowIcon />
      </Link>
    ) : null

  return (
    <header
      className={[
        'setup-header',
        'staff-flow-header',
        isHomeScreen ? 'staff-flow-header--home' : '',
        showBack ? 'staff-flow-header--with-back' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showBack ? (
        <div className="staff-flow-header-side staff-flow-header-side--left">{backControl}</div>
      ) : null}

      <div className="staff-flow-header-center">{logo}</div>

      {showBack ? (
        <div className="staff-flow-header-side staff-flow-header-side--right">
          {headerRight ?? <span className="staff-flow-header-spacer" aria-hidden />}
        </div>
      ) : null}
    </header>
  )
}
