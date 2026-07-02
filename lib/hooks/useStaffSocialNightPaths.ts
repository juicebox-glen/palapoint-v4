'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

import { getVenueScreenStaffContext } from '@/lib/venue-screen-staff-context'

const STAFF_SOCIAL_NIGHT_RE =
  /^\/staff\/([^/]+)\/social-night(\/.*)?$/

/** Resolve staff Social Night URLs so navigation stays under /staff/…/social-night. */
export function useStaffSocialNightPaths() {
  const pathname = usePathname()

  return useMemo(() => {
    const routeMatch = pathname.match(STAFF_SOCIAL_NIGHT_RE)
    const ctx = getVenueScreenStaffContext()
    const venueSlug = routeMatch?.[1] ?? ctx?.venueSlug ?? null
    const base = venueSlug ? `/staff/${venueSlug}/social-night` : null
    const inStaffFlow = Boolean(routeMatch && venueSlug)

    function path(subpath: string): string {
      const normalized = subpath.startsWith('/') ? subpath : `/${subpath}`
      if (base && inStaffFlow) return `${base}${normalized}`
      return `/matchplay${normalized}`
    }

    return { base, path, venueSlug, inStaffFlow }
  }, [pathname])
}

/** Build a staff Social Night href without the hook (e.g. in static Link props). */
export function staffSocialNightHref(venueSlug: string, subpath = ''): string {
  const normalized = subpath.startsWith('/') || subpath === '' ? subpath : `/${subpath}`
  return `/staff/${venueSlug}/social-night${normalized}`
}
