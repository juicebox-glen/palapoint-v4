import type { CSSProperties } from 'react'
import { supabase } from './supabase'

/** Bundled fallback when venue branding has no logo or remote URL fails. */
export const DEFAULT_VENUE_LOGO_SRC = '/images/squareone-logo.png'

/** Square One court team colours (matches gradient-wave-drift fallbacks). */
export const DEFAULT_TEAM_A_COLOR = '#3A5FF9'
export const DEFAULT_TEAM_B_COLOR = '#FF4DA6'

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

function parseHexColor(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return null
  const value = parseInt(match[1], 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function rgbaFromHex(hex: string, alpha: number, fallback: string): string {
  const rgb = parseHexColor(hex)
  if (!rgb) return fallback
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

function shiftHex(hex: string, delta: number): string {
  const rgb = parseHexColor(hex)
  if (!rgb) return hex
  const clamp = (channel: number) => Math.max(0, Math.min(255, channel + delta))
  return `#${[clamp(rgb[0]), clamp(rgb[1]), clamp(rgb[2])]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`
}

/** CSS custom properties for venue branding — team A/B, glows, and brand primary. */
export function brandingStylesFor(branding: VenueBranding | null | undefined): CSSProperties {
  const teamA = branding?.primaryColor || DEFAULT_TEAM_A_COLOR
  const teamB = branding?.secondaryColor || DEFAULT_TEAM_B_COLOR

  return {
    '--brand-primary': teamA,
    '--brand-primary-hover': shiftHex(teamA, -16),
    '--brand-primary-glow': rgbaFromHex(teamA, 0.3, 'rgba(58, 95, 249, 0.3)'),
    '--team-a': teamA,
    '--team-a-light': shiftHex(teamA, 24),
    '--team-a-dark': shiftHex(teamA, -16),
    '--team-a-bg': rgbaFromHex(teamA, 0.15, 'rgba(58, 95, 249, 0.15)'),
    '--team-a-glow': rgbaFromHex(teamA, 0.4, 'rgba(58, 95, 249, 0.4)'),
    '--team-a-color': teamA,
    '--team-b': teamB,
    '--team-b-light': shiftHex(teamB, 24),
    '--team-b-dark': shiftHex(teamB, -16),
    '--team-b-bg': rgbaFromHex(teamB, 0.15, 'rgba(255, 77, 166, 0.15)'),
    '--team-b-glow': rgbaFromHex(teamB, 0.4, 'rgba(255, 77, 166, 0.4)'),
    '--team-b-color': teamB,
  } as CSSProperties
}

function mapCourtRowToBranding(data: Record<string, unknown>): VenueBranding {
  const venue = data.venues as Record<string, unknown>
  const company = venue?.companies as Record<string, unknown>
  const branding = ((company?.config as Record<string, unknown>)?.branding as Record<string, unknown>) || {}

  return {
    companyName: (company?.name as string) ?? '',
    companySlug: (company?.slug as string) ?? '',
    venueName: (venue?.name as string) ?? '',
    venueSlug: (venue?.slug as string) ?? '',
    courtNumber: data.court_number as number,
    courtName: (data.name as string) || `Court ${data.court_number}`,
    courtId: data.id as string,
    isShowCourt: Boolean(data.is_show_court),
    primaryColor: (branding.primary_color as string) || DEFAULT_TEAM_A_COLOR,
    secondaryColor: (branding.secondary_color as string) || DEFAULT_TEAM_B_COLOR,
    logoUrl: (branding.logo_url as string) || null,
  }
}

const COURT_BRANDING_SELECT = `
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

export async function getVenueBranding(
  companySlug: string,
  venueSlug: string,
  courtNumber: number | string
): Promise<VenueBranding | null> {
  const courtNum = typeof courtNumber === 'string' ? parseInt(courtNumber, 10) : courtNumber

  const { data, error } = await supabase
    .from('courts')
    .select(COURT_BRANDING_SELECT)
    .eq('venues.companies.slug', companySlug)
    .eq('venues.slug', venueSlug)
    .eq('court_number', courtNum)
    .single()

  if (error || !data) {
    console.error('Venue lookup failed:', error)
    return null
  }

  return mapCourtRowToBranding(data as Record<string, unknown>)
}

/** Load branding when the route only has a court slug or UUID. */
export async function getVenueBrandingForCourtId(courtId: string): Promise<VenueBranding | null> {
  const { data, error } = await supabase
    .from('courts')
    .select(COURT_BRANDING_SELECT)
    .eq('id', courtId)
    .maybeSingle()

  if (error || !data) {
    console.error('Court branding lookup failed:', error)
    return null
  }

  return mapCourtRowToBranding(data as Record<string, unknown>)
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
