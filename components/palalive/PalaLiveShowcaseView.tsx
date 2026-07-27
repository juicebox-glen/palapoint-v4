import type { CSSProperties } from 'react'

import { PalaLiveClock } from '@/components/palalive/PalaLiveClock'
import { PalaLiveShowcaseAmbient } from '@/components/palalive/PalaLiveShowcaseAmbient'
import { PalaLiveShell } from '@/components/palalive/PalaLiveShell'
import { PalaLiveWeatherStub } from '@/components/palalive/PalaLiveWeatherStub'
import { ShowcaseMatchCard } from '@/components/palalive/ShowcaseMatchCard'
import { ShowcasePregameCard } from '@/components/palalive/ShowcasePregameCard'
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
  const isPregame = match.status === 'setup'

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
          <div className="palalive-scoreboard-slot">
            {isPregame ? <ShowcasePregameCard match={match} /> : <ShowcaseScoreboard match={match} />}
          </div>
          <ShowcaseMatchCard match={match} />
        </>
      }
    />
  )
}
