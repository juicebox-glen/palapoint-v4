'use client'

import { useEffect, useMemo, useState } from 'react'
import { getCourtBySlug } from '@/lib/supabase'
import { getVenueBranding, type VenueBranding } from '@/lib/venue'

export interface CourtRouteResult {
  courtId: string | null
  branding: VenueBranding | null
  /** Storage / URL key: `company/venue/court` or single slug */
  courtSlug: string
  /** Display label: branding court name or DB court name / slug */
  courtName: string
  isLoading: boolean
  error: string | null
}

const MSG_EMPTY =
  'Invalid URL. Use /[page]/[court-slug] or /[page]/[company]/[venue]/[court].'
const MSG_INVALID =
  'Invalid URL. Use /[page]/[court-slug] or /[page]/[company]/[venue]/[court].'

/**
 * Resolves court id + branding from catch-all URL segments.
 *
 * - 3 segments: `/page/company/venue/court` → {@link getVenueBranding}
 * - 1 segment: `/page/slug` or UUID → {@link getCourtBySlug}
 */
export function useCourtRoute(segments: string[] = []): CourtRouteResult {
  const [courtId, setCourtId] = useState<string | null>(null)
  const [branding, setBranding] = useState<VenueBranding | null>(null)
  const [courtName, setCourtName] = useState('Court 1')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const segmentKey = useMemo(() => segments.join('/'), [segments])

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      setIsLoading(true)
      setError(null)
      setCourtId(null)
      setBranding(null)
      setCourtName('Court 1')

      const parts = segmentKey === '' ? [] : segmentKey.split('/')

      if (parts.length === 0) {
        if (!cancelled) {
          setError(MSG_EMPTY)
          setIsLoading(false)
        }
        return
      }

      if (parts.length !== 1 && parts.length !== 3) {
        if (!cancelled) {
          setError(MSG_INVALID)
          setIsLoading(false)
        }
        return
      }

      try {
        if (parts.length === 3) {
          const [company, venue, court] = parts
          const result = await getVenueBranding(company!, venue!, court!)
          if (cancelled) return
          if (result) {
            setCourtId(result.courtId)
            setBranding(result)
            setCourtName(result.courtName)
          } else {
            setError('Venue not found')
          }
        } else {
          const slug = parts[0]!
          const court = await getCourtBySlug(slug)
          if (cancelled) return
          if (court) {
            setCourtId(court.id)
            setBranding(null)
            setCourtName(court.name || slug)
          } else {
            setError('Court not found')
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('useCourtRoute:', err)
          setError(
            err instanceof Error ? err.message : 'Failed to load court'
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void resolve()

    return () => {
      cancelled = true
    }
  }, [segmentKey])

  return {
    courtId,
    branding,
    courtSlug: segmentKey,
    courtName,
    isLoading,
    error,
  }
}
