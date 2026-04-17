'use client'

import type { CSSProperties } from 'react'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import SetupDisplay from '@/components/displays/SetupDisplay'

import { designSystemSquareOneBranding } from '../../lib/squareone-mock-branding'
import { getSetupPreviewConfig } from './setup-preview-config'

function SetupPreviewContent() {
  const searchParams = useSearchParams()
  const state = searchParams.get('state') || 'form'
  const preview = useMemo(() => getSetupPreviewConfig(state), [state])

  const brandingStyles = useMemo(
    () =>
      ({
        '--brand-primary': designSystemSquareOneBranding.primaryColor,
        '--team-a': designSystemSquareOneBranding.primaryColor,
        '--team-b': designSystemSquareOneBranding.secondaryColor,
      }) as CSSProperties,
    []
  )

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

export default function SetupPreviewPage() {
  return (
    <Suspense fallback={<div className="ds-preview-fallback">Loading setup preview…</div>}>
      <SetupPreviewContent />
    </Suspense>
  )
}
