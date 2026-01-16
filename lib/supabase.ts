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
