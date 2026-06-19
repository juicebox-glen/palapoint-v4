import type { CSSProperties } from 'react'

import GradientWaveDrift from '@/components/backgrounds/GradientWaveDrift'
import { VenueLogo } from '@/components/shared/VenueLogo'
import type { VenueBranding } from '@/lib/venue'

import { SpectatorHeader } from './SpectatorHeader'

interface SpectatorIdleProps {
  branding: VenueBranding | null
  brandingStyles?: CSSProperties
}

export function SpectatorIdle({ branding, brandingStyles }: SpectatorIdleProps) {
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
      </div>
    </div>
  )
}
