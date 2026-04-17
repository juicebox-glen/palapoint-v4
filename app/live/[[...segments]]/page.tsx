'use client'

import { useParams } from 'next/navigation'
import { useCourtRoute } from '@/lib/hooks/useCourtRoute'
import SpectatorDisplay from '@/components/displays/spectator'

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
