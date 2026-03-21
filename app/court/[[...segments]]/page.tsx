'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getCourtBySlug } from '@/lib/supabase'
import { getVenueBranding, type VenueBranding } from '@/lib/supabase/venue'
import CourtDisplay from '@/components/displays/CourtDisplay'

export default function CourtPage() {
  const params = useParams()
  const segments = (params.segments as string[] | undefined) ?? []

  const [courtId, setCourtId] = useState<string | null>(null)
  const [setupSlug, setSetupSlug] = useState<string | null>(null)
  const [branding, setBranding] = useState<VenueBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (segments.length === 0) {
      setError('Invalid URL. Use /court/[court-slug] or /court/[company]/[venue]/[court]')
      setLoading(false)
      return
    }

    async function resolve() {
      try {
        if (segments.length === 3) {
          const [company, venue, court] = segments
          const result = await getVenueBranding(company!, venue!, court!)
          if (result) {
            setCourtId(result.courtId)
            setSetupSlug(segments.join('/'))
            setBranding(result)
          } else {
            setError('Venue not found')
          }
        } else if (segments.length === 1) {
          const court = await getCourtBySlug(segments[0]!)
          if (court) {
            setCourtId(court.id)
            setSetupSlug(segments[0]!)
            setBranding(null)
          } else {
            setError('Court not found')
          }
        } else {
          setError('Invalid URL. Use /court/[court-slug] or /court/[company]/[venue]/[court]')
        }
      } catch (err) {
        console.error('Error resolving court:', err)
        setError('Failed to load court')
      }
      setLoading(false)
    }

    resolve()
  }, [segments])

  if (loading) {
    return (
      <div className="court-idle">
        <div className="court-idle-main-text">Loading...</div>
      </div>
    )
  }

  if (error || !courtId || !setupSlug) {
    return (
      <div className="court-idle">
        <div className="court-idle-main-text">{error ?? 'Court not found'}</div>
      </div>
    )
  }

  if (branding) {
    return (
      <div
        style={
          {
            '--brand-primary': branding.primaryColor,
            '--team-a': branding.primaryColor,
            '--team-b': branding.secondaryColor,
          } as React.CSSProperties
        }
      >
        <CourtDisplay courtId={courtId} setupSlug={setupSlug} branding={branding} />
      </div>
    )
  }

  return <CourtDisplay courtId={courtId} setupSlug={setupSlug} branding={null} />
}
