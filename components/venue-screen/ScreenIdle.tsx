import type { CSSProperties } from 'react'

import GradientWaveDrift from '@/components/backgrounds/GradientWaveDrift'
import { VenueLogo } from '@/components/shared/VenueLogo'
import type { VenueBranding } from '@/lib/venue'

interface ScreenIdleProps {
  branding: VenueBranding | null
  brandingStyles?: CSSProperties
  venueName?: string
  loading?: boolean
}

export function ScreenIdle({
  branding,
  brandingStyles,
  venueName,
  loading = false,
}: ScreenIdleProps) {
  const label = venueName ?? branding?.venueName ?? 'Venue'

  return (
    <div className="venue-screen venue-screen--idle" style={brandingStyles}>
      <GradientWaveDrift />
      <div className="venue-screen-idle-inner">
        <p className="venue-screen-kicker">PalaPoint Live</p>
        <VenueLogo branding={branding} className="venue-screen-idle-logo" />
        <p className="venue-screen-idle-venue">{label}</p>
        <p className="venue-screen-idle-message">
          {loading ? 'Loading…' : 'Ready — waiting for staff'}
        </p>
      </div>
    </div>
  )
}
