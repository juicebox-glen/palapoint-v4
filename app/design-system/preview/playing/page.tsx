'use client'

import type { CSSProperties } from 'react'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import PlayingDisplay from '@/components/displays/PlayingDisplay'

import { designSystemSquareOneBranding } from '../../lib/squareone-mock-branding'
import { getPlayingPreviewConfig } from './playing-preview-config'

function PlayingPreviewContent() {
  const searchParams = useSearchParams()
  const state = searchParams.get('state') || 'live'
  const preview = useMemo(() => getPlayingPreviewConfig(state), [state])

  const brandingStyles = useMemo(
    () =>
      ({
        '--team-a': designSystemSquareOneBranding.primaryColor,
        '--team-b': designSystemSquareOneBranding.secondaryColor,
        '--brand-primary': designSystemSquareOneBranding.primaryColor,
      }) as CSSProperties,
    []
  )

  return (
    <div style={{ minHeight: '100vh', ...brandingStyles }}>
      <PlayingDisplay
        key={state}
        courtId="mock-court-id"
        courtSlug="squareone/ashford/1"
        courtName={designSystemSquareOneBranding.courtName}
        branding={designSystemSquareOneBranding}
        preview={preview}
      />
    </div>
  )
}

export default function PlayingPreviewPage() {
  return (
    <Suspense fallback={<div className="ds-preview-fallback">Loading playing preview…</div>}>
      <PlayingPreviewContent />
    </Suspense>
  )
}
