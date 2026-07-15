'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { PalaLiveIdle } from '@/components/palalive/PalaLiveIdle'
import { PalaLiveModeWaiting } from '@/components/palalive/PalaLiveModeWaiting'
import { PalaLiveShowcaseEndgameView } from '@/components/palalive/PalaLiveShowcaseEndgameView'
import { PalaLiveShowcaseView } from '@/components/palalive/PalaLiveShowcaseView'
import { PalaLiveSocialView } from '@/components/palalive/PalaLiveSocialView'
import { MOCK_COURT_BOOKINGS } from '@/lib/palalive/mock-bookings'
import { MOCK_SHOWCASE_ENDGAME, MOCK_SHOWCASE_MATCH } from '@/lib/palalive/mock-showcase'
import { MOCK_SOCIAL_INGAME, MOCK_SOCIAL_POSTGAME, MOCK_SOCIAL_PREGAME } from '@/lib/palalive/mock-social-night'
import { palaLiveBrandingStylesFor } from '@/lib/venue'

import { TvViewportCanvas } from '../../components/TvViewportCanvas'
import { designSystemSquareOneBranding } from '../../lib/squareone-mock-branding'

const brandingStyles = palaLiveBrandingStylesFor(designSystemSquareOneBranding)

function PalaLivePreviewContent() {
  const searchParams = useSearchParams()
  const state = searchParams.get('state') || 'idle'
  const embed = searchParams.get('embed') === '1'

  let content

  switch (state) {
    case 'social-waiting':
      content = (
        <PalaLiveModeWaiting
          mode="social_night"
          displayName="Main Lounge"
          branding={designSystemSquareOneBranding}
          brandingStyles={brandingStyles}
          subtitle="Waiting for staff to select an event."
        />
      )
      break
    case 'social-pregame':
      content = (
        <PalaLiveSocialView branding={designSystemSquareOneBranding} brandingStyles={brandingStyles} data={MOCK_SOCIAL_PREGAME} />
      )
      break
    case 'social-ingame':
      content = (
        <PalaLiveSocialView branding={designSystemSquareOneBranding} brandingStyles={brandingStyles} data={MOCK_SOCIAL_INGAME} />
      )
      break
    case 'social-postgame':
      content = (
        <PalaLiveSocialView branding={designSystemSquareOneBranding} brandingStyles={brandingStyles} data={MOCK_SOCIAL_POSTGAME} />
      )
      break
    case 'showcase-waiting':
      content = (
        <PalaLiveModeWaiting
          mode="showcase_game"
          displayName="Main Lounge"
          branding={designSystemSquareOneBranding}
          brandingStyles={brandingStyles}
          subtitle="Waiting for staff to start a match."
        />
      )
      break
    case 'showcase':
      content = (
        <PalaLiveShowcaseView branding={designSystemSquareOneBranding} brandingStyles={brandingStyles} match={MOCK_SHOWCASE_MATCH} />
      )
      break
    case 'showcase-endgame':
      content = (
        <PalaLiveShowcaseEndgameView
          branding={designSystemSquareOneBranding}
          brandingStyles={brandingStyles}
          match={MOCK_SHOWCASE_ENDGAME}
        />
      )
      break
    case 'idle':
    default:
      content = (
        <PalaLiveIdle
          branding={designSystemSquareOneBranding}
          brandingStyles={brandingStyles}
          bookings={MOCK_COURT_BOOKINGS}
        />
      )
      break
  }

  return (
    <TvViewportCanvas embed={embed} style={brandingStyles}>
      {content}
    </TvViewportCanvas>
  )
}

export default function PalaLivePreviewPage() {
  return (
    <Suspense fallback={<div className="ds-preview-fallback">Loading…</div>}>
      <PalaLivePreviewContent />
    </Suspense>
  )
}
