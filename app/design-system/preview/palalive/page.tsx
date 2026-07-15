'use client'

import type { CSSProperties } from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { PalaLiveIdle } from '@/components/palalive/PalaLiveIdle'
import { MOCK_COURT_BOOKINGS } from '@/lib/palalive/mock-bookings'

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
