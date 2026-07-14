import type { CSSProperties } from 'react'

import { PalaLiveClock } from '@/components/palalive/PalaLiveClock'
import { PalaLiveShell } from '@/components/palalive/PalaLiveShell'
import { PalaLiveWeatherStub } from '@/components/palalive/PalaLiveWeatherStub'
import { ShowcaseMatchCard } from '@/components/palalive/ShowcaseMatchCard'
import { ShowcaseScoreboard } from '@/components/palalive/ShowcaseScoreboard'
import type { MatchState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'

import '@/app/styles/palalive-showcase.css'

interface PalaLiveShowcaseViewProps {
  match: MatchState
  branding: VenueBranding | null
  brandingStyles?: CSSProperties
}

export function PalaLiveShowcaseView({ match, branding, brandingStyles }: PalaLiveShowcaseViewProps) {
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
          <div className="palalive-showcase-ambient" aria-hidden="true">
            <div className="palalive-showcase-ambient__wash" />
            <div className="palalive-showcase-ambient__orb palalive-showcase-ambient__orb--a" />
            <div className="palalive-showcase-ambient__orb palalive-showcase-ambient__orb--b" />
            <div className="palalive-showcase-ambient__orb palalive-showcase-ambient__orb--c" />
            <div className="palalive-showcase-ambient__vignette" />
          </div>
          <div className="palalive-scoreboard-slot">
            <ShowcaseScoreboard match={match} />
          </div>
          <ShowcaseMatchCard match={match} />
        </>
      }
    />
  )
}
