'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getCourtBySlug } from '@/lib/supabase'
import { getVenueBranding, type VenueBranding } from '@/lib/supabase/venue'
import SpectatorDisplay from '@/components/displays/SpectatorDisplay'

export default function LivePage() {
  const params = useParams()
  const segments = (params.segments as string[] | undefined) ?? []

  const [courtId, setCourtId] = useState<string | null>(null)
  const [branding, setBranding] = useState<VenueBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (segments.length === 0) {
      setError('Invalid URL. Use /live/[court-slug] or /live/[company]/[venue]/[court]')
      setLoading(false)
      return
    }

    async function resolve() {
      try {
        if (segments.length === 3) {
          // New format: /live/squareone/ashford/1
          const [company, venue, court] = segments
          const result = await getVenueBranding(company!, venue!, court!)
          if (result) {
            setCourtId(result.courtId)
            setBranding(result)
          } else {
            setError('Venue not found')
          }
        } else if (segments.length === 1) {
          // Legacy format: /live/court-1 or /live/uuid
          const court = await getCourtBySlug(segments[0]!)
          if (court) {
            setCourtId(court.id)
            setBranding(null)
          } else {
            setError('Court not found')
          }
        } else {
          setError('Invalid URL. Use /live/[court-slug] or /live/[company]/[venue]/[court]')
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
      <div className="spectator-container">
        <p className="spectator-loading">Loading...</p>
      </div>
    )
  }

  if (error || !courtId) {
    return (
      <div className="spectator-container">
        <p className="spectator-error">{error ?? 'Court not found'}</p>
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
        <SpectatorDisplay courtId={courtId} branding={branding} />
      </div>
    )
  }

  return <SpectatorDisplay courtId={courtId} branding={null} />
}
