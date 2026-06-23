import type { CSSProperties } from 'react'

import GradientWaveDrift from '@/components/backgrounds/GradientWaveDrift'
import { VenueLogo } from '@/components/shared/VenueLogo'
import type { VenueBranding } from '@/lib/venue'

import { SpectatorHeader } from './SpectatorHeader'

interface SpectatorIdleProps {
  branding: VenueBranding | null
  brandingStyles?: CSSProperties
  /** When true, keep idle chrome visible while match data loads */
  loading?: boolean
}

export function SpectatorIdle({
  branding,
  brandingStyles,
  loading = false,
}: SpectatorIdleProps) {
  const courtLabel = (branding?.courtName ?? 'Court 1').toUpperCase()

  return (
    <div
      className="spectator-container spectator-container--idle"
      style={brandingStyles}
    >
      <GradientWaveDrift />
      <SpectatorHeader
        branding={branding}
        variant="idle"
        courtLabel={courtLabel}
        showLogo={false}
      />
      <div className="spectator-idle-hero">
        <VenueLogo branding={branding} className="spectator-idle-logo-img" />
        {loading ? <p className="spectator-idle-loading">Loading...</p> : null}
      </div>
    </div>
  )
}
