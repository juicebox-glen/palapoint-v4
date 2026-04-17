'use client'

import { useParams } from 'next/navigation'
import { useCourtRoute } from '@/lib/hooks/useCourtRoute'
import PlayingDisplay from '@/components/displays/PlayingDisplay'

export default function PlayingPage() {
  const params = useParams()
  const segments = (params.segments as string[] | undefined) ?? []

  const { courtId, branding, courtSlug, courtName, isLoading, error } =
    useCourtRoute(segments)

  if (isLoading) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <div className="page-loading" style={{ flex: 1, paddingTop: '20px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !courtId || !courtSlug) {
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
        <PlayingDisplay
          courtId={courtId}
          courtSlug={courtSlug}
          courtName={courtName}
          branding={branding}
        />
      </div>
    )
  }

  return (
    <PlayingDisplay
      courtId={courtId}
      courtSlug={courtSlug}
      courtName={courtName}
      branding={null}
    />
  )
}
