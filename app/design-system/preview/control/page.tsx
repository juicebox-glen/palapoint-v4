'use client'

/**
 * Design-system iframe target: real `ControlPanel` in preview mode (no Supabase actions).
 * States: loading → setup → preview → live → endgame (+ multi-set / end-match modal) via `?state=`. See `control-preview-config.ts` for mock data.
 */
import type { CSSProperties } from 'react'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import ControlPanel from '@/components/displays/ControlPanel'
import { palaLiveBrandingStylesFor } from '@/lib/venue'

import { designSystemSquareOneBranding } from '../../lib/squareone-mock-branding'
import { getControlPreviewConfig } from './control-preview-config'

import '@/app/styles/palalive-tokens.css'

function ControlPreviewContent() {
  const searchParams = useSearchParams()
  const state = searchParams.get('state') || 'setup'
  const variant = searchParams.get('variant') === 'palalive-staff' ? 'palalive-staff' : 'legacy'

  const preview = useMemo(() => getControlPreviewConfig(state), [state])

  const brandingStyles = useMemo(() => {
    if (variant === 'palalive-staff') {
      return {
        ...palaLiveBrandingStylesFor(designSystemSquareOneBranding),
        background: '#000000',
        color: '#e9ecf1',
      } as CSSProperties
    }
    return {
      '--brand-primary': designSystemSquareOneBranding.primaryColor,
      '--team-a': designSystemSquareOneBranding.primaryColor,
      '--team-b': designSystemSquareOneBranding.secondaryColor,
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    } as CSSProperties
  }, [variant])

  return (
    <div
      className={[
        'page control-ds-preview-root',
        variant === 'palalive-staff' ? 'palalive-staff-shell' : null,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ minHeight: '100vh', ...brandingStyles }}
    >
      <ControlPanel
        key={state}
        courtId="mock-court-id"
        branding={designSystemSquareOneBranding}
        courtName={designSystemSquareOneBranding.courtName}
        preview={preview}
        variant={variant}
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
