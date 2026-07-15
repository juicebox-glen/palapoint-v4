'use client'

/**
 * Design-system iframe target: real `ControlPanel` in preview mode (no Supabase actions).
 * States: loading → setup → preview → live → endgame (+ multi-set / end-match modal) via `?state=`. See `control-preview-config.ts` for mock data.
 *
 * PalaLive staff variant mirrors production `/staff/[venue]/showcase`: StaffAppFrame
 * owns header + page padding; ControlPanel is embedded inside.
 */
import type { CSSProperties } from 'react'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import ControlPanel from '@/components/displays/ControlPanel'
import { StaffAppFrame } from '@/components/venue-screen/StaffAppFrame'
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
      return palaLiveBrandingStylesFor(designSystemSquareOneBranding)
    }
    return {
      '--brand-primary': designSystemSquareOneBranding.primaryColor,
      '--team-a': designSystemSquareOneBranding.primaryColor,
      '--team-b': designSystemSquareOneBranding.secondaryColor,
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    } as CSSProperties
  }, [variant])

  if (variant === 'palalive-staff') {
    return (
      <StaffAppFrame venueSlug="dev" backHref="/staff/dev" style={brandingStyles}>
        <ControlPanel
          key={state}
          courtId="mock-court-id"
          branding={designSystemSquareOneBranding}
          courtName={designSystemSquareOneBranding.courtName}
          preview={preview}
          showSetupHeader={false}
          embedded
          variant="palalive-staff"
        />
      </StaffAppFrame>
    )
  }

  return (
    <div className="page control-ds-preview-root" style={{ minHeight: '100vh', ...brandingStyles }}>
      <ControlPanel
        key={state}
        courtId="mock-court-id"
        branding={designSystemSquareOneBranding}
        courtName={designSystemSquareOneBranding.courtName}
        preview={preview}
        variant="legacy"
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
