import type { VenueBranding } from '@/lib/venue'
import { VenueLogo } from '@/components/shared/VenueLogo'

function LogoContent({ branding }: { branding: VenueBranding | null }) {
  return <VenueLogo branding={branding} className="spectator-logo-img" />
}

export type SpectatorHeaderVariant = 'idle' | 'pregame' | 'live' | 'endgame'

export interface SpectatorHeaderProps {
  branding: VenueBranding | null
  variant: SpectatorHeaderVariant
  /** Uppercased court label for pregame / live */
  courtLabel?: string
  /** Endgame: full game mode label (e.g. GOLDEN POINT) */
  gameModeText?: string
}

export function SpectatorHeader({
  branding,
  variant,
  courtLabel,
  gameModeText,
}: SpectatorHeaderProps) {
  return (
    <div className="spectator-header">
      <div className="spectator-logo">
        <LogoContent branding={branding} />
      </div>

      {variant === 'idle' && (
        <div className="spectator-header-right">
          <div className="spectator-live-badge">
            <span className="spectator-offline-dot" aria-hidden />
            <span>OFFLINE</span>
          </div>
        </div>
      )}

      {variant === 'pregame' && (
        <div className="spectator-header-badges">
          <div className="spectator-ready-badge">
            <span className="spectator-ready-dot" aria-hidden />
            <span>READY</span>
          </div>
          {courtLabel != null && courtLabel !== '' && (
            <div className="spectator-court-badge">{courtLabel}</div>
          )}
        </div>
      )}

      {variant === 'live' && (
        <div className="spectator-header-badges">
          <div className="spectator-live-badge">
            <span className="spectator-live-dot" aria-hidden />
            <span>LIVE</span>
          </div>
          {courtLabel != null && courtLabel !== '' && (
            <div className="spectator-court-badge">{courtLabel}</div>
          )}
        </div>
      )}

      {variant === 'endgame' && (
        <div className="spectator-header-right">
          <div className="spectator-game-info">
            <span>{gameModeText ?? ''}</span>
          </div>
          <div className="spectator-final-badge">
            <span className="spectator-final-dot" aria-hidden />
            <span>FINAL</span>
          </div>
        </div>
      )}
    </div>
  )
}
