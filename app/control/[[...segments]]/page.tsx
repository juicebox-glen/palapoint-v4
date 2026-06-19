'use client'

import { useParams } from 'next/navigation'
import { useCourtRoute } from '@/lib/hooks/useCourtRoute'
import ControlPanel from '@/components/displays/ControlPanel'
import { brandingStylesFor } from '@/lib/venue'

export default function ControlPage() {
  const params = useParams()
  const segments = (params.segments as string[] | undefined) ?? []

  const { courtId, branding, courtName, isLoading, error } = useCourtRoute(segments)

  if (isLoading) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <div className="page-loading" style={{ flex: 1, paddingTop: '20px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !courtId) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <div className="page-loading" style={{ flex: 1, paddingTop: '20px' }}>
          <p style={{ fontSize: '1.5rem', color: 'var(--error)' }}>
            {error ?? 'Court not found'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={brandingStylesFor(branding)}>
      <ControlPanel courtId={courtId} branding={branding} courtName={courtName} />
    </div>
  )
}
