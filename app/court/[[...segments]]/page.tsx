'use client'

import { useParams } from 'next/navigation'
import { useCourtRoute } from '@/lib/hooks/useCourtRoute'
import CourtDisplay from '@/components/displays/CourtDisplay'
import { brandingStylesFor } from '@/lib/venue'

export default function CourtPage() {
  const params = useParams()
  const segments = (params.segments as string[] | undefined) ?? []

  const { courtId, branding, courtSlug, isLoading, error } =
    useCourtRoute(segments)

  if (isLoading) {
    return (
      <div className="court-idle">
        <div className="court-idle-main-text">Loading...</div>
      </div>
    )
  }

  if (error || !courtId || !courtSlug) {
    return (
      <div className="court-idle">
        <div className="court-idle-main-text">{error ?? 'Court not found'}</div>
      </div>
    )
  }

  return (
    <div style={brandingStylesFor(branding)}>
      <CourtDisplay courtId={courtId} setupSlug={courtSlug} branding={branding} />
    </div>
  )
}
