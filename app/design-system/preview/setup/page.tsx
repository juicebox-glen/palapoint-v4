'use client'

import type { CSSProperties } from 'react'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import SetupDisplay from '@/components/displays/SetupDisplay'

import { designSystemSquareOneBranding } from '../../lib/squareone-mock-branding'
import {
  InProgressState,
  JoinState,
  ScanState,
  WaitingState,
} from './setup-illustrated'
import { getSetupPreviewConfig } from './setup-preview-config'

function SetupPreviewContent() {
  const searchParams = useSearchParams()
  const state = searchParams.get('state') || 'scan'

  const brandingStyles = useMemo(
    () =>
      ({
        '--brand-primary': designSystemSquareOneBranding.primaryColor,
        '--team-a': designSystemSquareOneBranding.primaryColor,
        '--team-b': designSystemSquareOneBranding.secondaryColor,
      }) as CSSProperties,
    []
  )

  if (state === 'form' || state === 'review') {
    const preview = getSetupPreviewConfig(state)
    return (
      <div style={{ minHeight: '100vh', ...brandingStyles }}>
        <SetupDisplay
          key={state}
          courtId="mock-court-id"
          courtSlug="squareone/ashford/1"
          branding={designSystemSquareOneBranding}
          preview={preview}
        />
      </div>
    )
  }

  const illustrated =
    state === 'join' || state === 'waiting' || state === 'in_progress' ? state : 'scan'

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
      {illustrated === 'scan' && <ScanState branding={designSystemSquareOneBranding} />}
      {illustrated === 'join' && <JoinState branding={designSystemSquareOneBranding} />}
      {illustrated === 'waiting' && <WaitingState branding={designSystemSquareOneBranding} />}
      {illustrated === 'in_progress' && <InProgressState branding={designSystemSquareOneBranding} />}
    </div>
  )
}

export default function SetupPreviewPage() {
  return (
    <Suspense fallback={<div className="ds-preview-fallback">Loading setup preview…</div>}>
      <SetupPreviewContent />
    </Suspense>
  )
}
