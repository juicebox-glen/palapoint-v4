import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Court {
  id: string
  venue_id: string
  name: string
  court_number: number
  slug: string | null
  venue?: {
    id: string
    name: string
    company_id: string
  }
}

/**
 * Get court by slug or ID (tries slug first, then ID if it looks like a UUID)
 * Returns court with venue and company data
 */
export async function getCourtBySlug(slug: string): Promise<Court | null> {
  // First, try to find by slug
  const { data: slugData, error: slugError } = await supabase
    .from('courts')
    .select(`
      *,
      venue:venues (
        id,
        name,
        company_id
      )
    `)
    .eq('slug', slug)
    .maybeSingle()

  if (slugError) {
    console.error('Error fetching court by slug:', slugError)
  }

  if (slugData) {
    return slugData
  }

  // If not found by slug, check if input looks like a UUID
  // UUID format: 8-4-4-4-12 characters with hyphens (total length 36)
  const looksLikeUuid = slug.includes('-') && slug.length === 36

  if (looksLikeUuid) {
    // Try to find by ID
    const { data: idData, error: idError } = await supabase
      .from('courts')
      .select(`
        *,
        venue:venues (
          id,
          name,
          company_id
        )
      `)
      .eq('id', slug)
      .maybeSingle()

    if (idError) {
      console.error('Error fetching court by ID:', idError)
      return null
    }

    return idData
  }

  // Not found by slug and doesn't look like a UUID
  return null
}

/**
 * Get court by ID
 * Returns court with venue and company data
 */
export async function getCourtById(id: string): Promise<Court | null> {
  const { data, error } = await supabase
    .from('courts')
    .select(`
      *,
      venue:venues (
        id,
        name,
        company_id
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching court:', error)
    return null
  }

  return data
}

/**
 * Validate control PIN for a court
 * Checks if PIN exists in control_tokens table for the given court
 */
export async function validateControlPin(courtId: string, pin: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('control_tokens')
    .select('*')
    .eq('court_id', courtId)
    .eq('pin', pin)
    .maybeSingle()

  if (error) {
    console.error('Error validating PIN:', error)
    return false
  }

  // Check if token exists and is not expired
  if (!data) {
    return false
  }

  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at)
    const now = new Date()
    if (expiresAt < now) {
      return false
    }
  }

  return true
}

/**
 * Get venue ID for matchplay (from env or first venue in DB)
 */
export async function getMatchplayVenueId(): Promise<string | null> {
  const envVenue = process.env.NEXT_PUBLIC_MATCHPLAY_VENUE_ID
  if (envVenue?.trim()) return envVenue.trim()

  const { data, error } = await supabase
    .from('venues')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data.id
}

/** Company branding for matchplay setup header (logo + colours from company config). */
export interface MatchplayVenueHeaderBranding {
  venueName: string
  companyName: string
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
}

function unwrapJoinedRow<T>(raw: unknown): T | null {
  if (raw == null) return null
  if (Array.isArray(raw)) return (raw[0] as T) ?? null
  return raw as T
}

/**
 * Load venue + company branding for the same venue used by matchplay (`getMatchplayVenueId`).
 */
export async function getMatchplayVenueHeaderBranding(): Promise<MatchplayVenueHeaderBranding | null> {
  const venueId = await getMatchplayVenueId()
  if (!venueId) return null

  const { data, error } = await supabase
    .from('venues')
    .select(
      `
      id,
      name,
      companies (
        name,
        config
      )
    `
    )
    .eq('id', venueId)
    .maybeSingle()

  if (error || !data) return null

  const row = data as { name?: string; companies?: unknown }
  const company = unwrapJoinedRow<{ name?: string; config?: unknown }>(row.companies)
  const brandingCfg =
    (company?.config as Record<string, unknown> | null | undefined)?.branding as
      | Record<string, unknown>
      | undefined

  return {
    venueName: String(row.name ?? ''),
    companyName: String(company?.name ?? 'Venue'),
    logoUrl: typeof brandingCfg?.logo_url === 'string' ? brandingCfg.logo_url : null,
    primaryColor: typeof brandingCfg?.primary_color === 'string' ? brandingCfg.primary_color : null,
    secondaryColor: typeof brandingCfg?.secondary_color === 'string' ? brandingCfg.secondary_color : null,
  }
}

/**
 * Get first court for a venue (used for matchplay PIN validation)
 */
export async function getFirstCourtForVenue(venueId: string): Promise<Court | null> {
  const { data, error } = await supabase
    .from('courts')
    .select(`
      *,
      venue:venues (
        id,
        name,
        company_id
      )
    `)
    .eq('venue_id', venueId)
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data
}
