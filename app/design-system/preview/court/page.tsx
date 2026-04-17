'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import CourtDisplay from '@/components/displays/CourtDisplay'

import { designSystemSquareOneBranding } from '../../lib/squareone-mock-branding'
import { brandingStylesFor, getCourtPreviewConfig } from './court-preview-states'

function CourtPreviewContent() {
  const searchParams = useSearchParams()
  const state = searchParams.get('state') || 'idle'

  const preview = useMemo(() => getCourtPreviewConfig(state), [state])
  const brandingStyles = useMemo(() => brandingStylesFor(designSystemSquareOneBranding), [])

  return (
    <div
      className="court-ds-preview-root"
      style={{
        minHeight: '100vh',
        minWidth: '100%',
        ...brandingStyles,
      }}
    >
      <CourtDisplay
        key={state}
        courtId="mock-court-id"
        setupSlug="squareone/ashford/1"
        branding={designSystemSquareOneBranding}
        preview={preview}
      />
    </div>
  )
}

export default function CourtPreviewPage() {
  return (
    <Suspense fallback={<div className="ds-preview-fallback">Loading court preview…</div>}>
      <CourtPreviewContent />
    </Suspense>
  )
}
