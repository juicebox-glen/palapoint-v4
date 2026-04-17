import type { VenueBranding } from '@/lib/venue'
import { SpectatorHeader } from './SpectatorHeader'

interface SpectatorIdleProps {
  branding: VenueBranding | null
}

export function SpectatorIdle({ branding }: SpectatorIdleProps) {
  return (
    <div className="spectator-container">
      <SpectatorHeader branding={branding} variant="idle" />
      <div className="spectator-no-match">
        <p>No active match</p>
      </div>
    </div>
  )
}
