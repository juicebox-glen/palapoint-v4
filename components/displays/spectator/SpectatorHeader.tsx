import type { VenueBranding } from '@/lib/venue'
import { VenueLogo } from '@/components/shared/VenueLogo'

function LogoContent({ branding }: { branding: VenueBranding | null }) {
  return <VenueLogo branding={branding} className="spectator-logo-img" />
}

export type SpectatorHeaderVariant = 'idle' | 'pregame' | 'live' | 'endgame'

export interface SpectatorHeaderProps {
  branding: VenueBranding | null
  variant: SpectatorHeaderVariant
  /** Uppercased court label for header badges */
  courtLabel?: string
  /** When false, logo is omitted (idle hero shows logo centered instead) */
  showLogo?: boolean
}

export function SpectatorHeader({
  branding,
  variant,
  courtLabel,
  showLogo = true,
}: SpectatorHeaderProps) {
  const court =
    courtLabel != null && courtLabel !== '' ? (
      <div className="spectator-court-badge">{courtLabel}</div>
    ) : null

  return (
    <div className="spectator-header">
      {showLogo && (
        <div className="spectator-logo">
          <LogoContent branding={branding} />
        </div>
      )}

      {variant === 'idle' && (
        <div className="spectator-header-badges">
          <div className="spectator-offline-badge">
            <span className="spectator-offline-dot" aria-hidden />
            <span>OFFLINE</span>
          </div>
          {court}
        </div>
      )}

      {variant === 'pregame' && (
        <div className="spectator-header-badges">
          <div className="spectator-ready-badge">
            <span className="spectator-ready-dot" aria-hidden />
            <span>READY</span>
          </div>
          {court}
        </div>
      )}

      {variant === 'live' && (
        <div className="spectator-header-badges">
          <div className="spectator-live-badge">
            <span className="spectator-live-dot" aria-hidden />
            <span>LIVE</span>
          </div>
          {court}
        </div>
      )}

      {variant === 'endgame' && (
        <div className="spectator-header-badges">
          <div className="spectator-final-badge">
            <span className="spectator-final-dot" aria-hidden />
            <span>FINAL</span>
          </div>
          {court}
        </div>
      )}
    </div>
  )
}
