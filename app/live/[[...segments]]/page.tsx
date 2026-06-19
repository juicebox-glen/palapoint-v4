'use client'

import { useParams } from 'next/navigation'
import { useCourtRoute } from '@/lib/hooks/useCourtRoute'
import SpectatorDisplay from '@/components/displays/spectator'
import { brandingStylesFor } from '@/lib/venue'

export default function LivePage() {
  const params = useParams()
  const segments = (params.segments as string[] | undefined) ?? []

  const { courtId, branding, isLoading, error } = useCourtRoute(segments)

  if (isLoading) {
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

  return (
    <div style={brandingStylesFor(branding)}>
      <SpectatorDisplay courtId={courtId} branding={branding} />
    </div>
  )
}
