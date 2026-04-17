'use client'

import type { CSSProperties } from 'react'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import { designSystemSquareOneBranding } from '../../lib/squareone-mock-branding'
import { FinishedState, LiveState } from './playing-illustrated'

function PlayingPreviewContent() {
  const searchParams = useSearchParams()
  const state = searchParams.get('state') || 'live'

  const brandingStyles = useMemo(
    () =>
      ({
        '--team-a': designSystemSquareOneBranding.primaryColor,
        '--team-b': designSystemSquareOneBranding.secondaryColor,
        '--brand-primary': designSystemSquareOneBranding.primaryColor,
      }) as CSSProperties,
    []
  )

  const view = state === 'finished' ? 'finished' : 'live'

  return (
    <div
      className="page"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        ...brandingStyles,
      }}
    >
      {view === 'live' && <LiveState branding={designSystemSquareOneBranding} />}
      {view === 'finished' && <FinishedState branding={designSystemSquareOneBranding} />}
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
