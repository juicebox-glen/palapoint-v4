'use client'

import type { CSSProperties } from 'react'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import ControlPanel from '@/components/displays/ControlPanel'

import { designSystemSquareOneBranding } from '../../lib/squareone-mock-branding'
import { getControlPreviewConfig } from './control-preview-config'

function ControlPreviewContent() {
  const searchParams = useSearchParams()
  const state = searchParams.get('state') || 'setup'

  const preview = useMemo(() => getControlPreviewConfig(state), [state])

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
      <ControlPanel
        key={state}
        courtId="mock-court-id"
        branding={designSystemSquareOneBranding}
        preview={preview}
      />
    </div>
  )
}

export default function ControlPreviewPage() {
  return (
    <Suspense fallback={<div className="ds-preview-fallback">Loading control preview…</div>}>
      <ControlPreviewContent />
    </Suspense>
  )
}
