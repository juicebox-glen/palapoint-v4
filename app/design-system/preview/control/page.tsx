'use client'

/**
 * Design-system iframe target: real `ControlPanel` in preview mode (no Supabase actions).
 * States: loading → setup → preview → live → endgame (+ multi-set / end-match modal) via `?state=`. See `control-preview-config.ts` for mock data.
 */
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
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }) as CSSProperties,
    []
  )

  return (
    <div className="page control-ds-preview-root" style={{ minHeight: '100vh', ...brandingStyles }}>
      <ControlPanel
        key={state}
        courtId="mock-court-id"
        branding={designSystemSquareOneBranding}
        courtName={designSystemSquareOneBranding.courtName}
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
