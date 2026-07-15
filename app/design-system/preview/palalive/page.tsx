'use client'

import type { CSSProperties } from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { PalaLiveIdle } from '@/components/palalive/PalaLiveIdle'
import { PalaLiveShowcaseView } from '@/components/palalive/PalaLiveShowcaseView'
import { PalaLiveSocialView } from '@/components/palalive/PalaLiveSocialView'
import { MOCK_COURT_BOOKINGS } from '@/lib/palalive/mock-bookings'
import { MOCK_SHOWCASE_MATCH } from '@/lib/palalive/mock-showcase'
import { MOCK_SOCIAL_INGAME, MOCK_SOCIAL_POSTGAME, MOCK_SOCIAL_PREGAME } from '@/lib/palalive/mock-social-night'

import { TvViewportCanvas } from '../../components/TvViewportCanvas'
import { designSystemSquareOneBranding } from '../../lib/squareone-mock-branding'

const brandingStyles: CSSProperties = {
  '--brand-primary': designSystemSquareOneBranding.primaryColor,
  '--team-a': designSystemSquareOneBranding.primaryColor,
  '--team-b': designSystemSquareOneBranding.secondaryColor,
} as CSSProperties

function PalaLivePreviewContent() {
  const searchParams = useSearchParams()
  const state = searchParams.get('state') || 'idle'
  const embed = searchParams.get('embed') === '1'

  let content

  switch (state) {
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
    case 'showcase':
      content = (
        <PalaLiveShowcaseView branding={designSystemSquareOneBranding} brandingStyles={brandingStyles} match={MOCK_SHOWCASE_MATCH} />
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
