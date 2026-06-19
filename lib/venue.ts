import type { CSSProperties } from 'react'
import { supabase } from './supabase'

/** Bundled fallback when venue branding has no logo or remote URL fails. */
export const DEFAULT_VENUE_LOGO_SRC = '/images/squareone-logo.png'

export interface VenueBranding {
  companyName: string
  companySlug: string
  venueName: string
  venueSlug: string
  courtNumber: number
  courtName: string
  courtId: string
  isShowCourt: boolean
  primaryColor: string
  secondaryColor: string
  logoUrl: string | null
}

/** CSS custom properties for venue branding on route wrapper elements. */
export function brandingStylesFor(branding: VenueBranding | null | undefined): CSSProperties {
  return {
    '--brand-primary': branding?.primaryColor ?? '#5B6CFF',
    '--team-a': branding?.primaryColor ?? '#5B6CFF',
    '--team-b': branding?.secondaryColor ?? '#E84A8A',
  } as CSSProperties
}

export async function getVenueBranding(
  companySlug: string,
  venueSlug: string,
  courtNumber: number | string
): Promise<VenueBranding | null> {
  const courtNum = typeof courtNumber === 'string' ? parseInt(courtNumber, 10) : courtNumber

  // Query courts with venue and company joins
  const { data, error } = await supabase
    .from('courts')
    .select(
      `
      id,
      name,
      court_number,
      is_show_court,
      venues!inner (
        id,
        slug,
        name,
        companies!inner (
          id,
          slug,
          name,
          config
        )
      )
    `
    )
    .eq('venues.companies.slug', companySlug)
    .eq('venues.slug', venueSlug)
    .eq('court_number', courtNum)
    .single()

  if (error || !data) {
    console.error('Venue lookup failed:', error)
    return null
  }

  const venue = data.venues as unknown as Record<string, unknown>
  const company = venue?.companies as unknown as Record<string, unknown>
  const branding = ((company?.config as Record<string, unknown>)?.branding as Record<string, unknown>) || {}

  return {
    companyName: (company?.name as string) ?? '',
    companySlug: (company?.slug as string) ?? '',
    venueName: (venue?.name as string) ?? '',
    venueSlug: (venue?.slug as string) ?? '',
    courtNumber: data.court_number,
    courtName: data.name || `Court ${data.court_number}`,
    courtId: data.id,
    isShowCourt: data.is_show_court || false,
    primaryColor: (branding.primary_color as string) || '#5B6CFF',
    secondaryColor: (branding.secondary_color as string) || '#E84A8A',
    logoUrl: (branding.logo_url as string) || null,
  }
}

// Get court UUID by the three URL segments
export async function getCourtId(
  companySlug: string,
  venueSlug: string,
  courtNumber: number | string
): Promise<string | null> {
  const branding = await getVenueBranding(companySlug, venueSlug, courtNumber)
  return branding?.courtId || null
}
