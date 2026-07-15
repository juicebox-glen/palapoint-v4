import type { CSSProperties } from 'react'

import { PalaLiveClock } from '@/components/palalive/PalaLiveClock'
import { PalaLiveShowcaseAmbient } from '@/components/palalive/PalaLiveShowcaseAmbient'
import { PalaLiveShell } from '@/components/palalive/PalaLiveShell'
import { PalaLiveWeatherStub } from '@/components/palalive/PalaLiveWeatherStub'
import type { VenueScreenMode } from '@/lib/types/venue-screen'
import type { VenueBranding } from '@/lib/venue'

import '@/app/styles/palalive-showcase.css'
import '@/app/styles/palalive-waiting.css'

const MODE_TITLE: Record<Exclude<VenueScreenMode, 'idle'>, string> = {
  social_night: 'Social Night',
  showcase_game: 'Showcase Game',
}

interface PalaLiveModeWaitingProps {
  mode: Exclude<VenueScreenMode, 'idle'>
  branding: VenueBranding | null
  brandingStyles?: CSSProperties
  displayName?: string
  subtitle: string
}

/** Mode-armed TV hold — same PalaLive shell / bottom bar as Idle & live modes. */
export function PalaLiveModeWaiting({
  mode,
  branding,
  brandingStyles,
  displayName,
  subtitle,
}: PalaLiveModeWaitingProps) {
  return (
    <PalaLiveShell
      branding={branding}
      brandingStyles={brandingStyles}
      bottomBarRight={
        <>
          <PalaLiveWeatherStub />
          <PalaLiveClock />
        </>
      }
      mainStage={
        <>
          <PalaLiveShowcaseAmbient />
          <div className="palalive-waiting">
            <div className="palalive-waiting-card">
              <p className="palalive-waiting-kicker">PalaPoint Live</p>
              <h1 className="palalive-waiting-title">{MODE_TITLE[mode]}</h1>
              {displayName ? <p className="palalive-waiting-screen">{displayName}</p> : null}
              <p className="palalive-waiting-subtitle">{subtitle}</p>
            </div>
          </div>
        </>
      }
    />
  )
}
