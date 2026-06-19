'use client'

import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'

import SessionReviewDisplay from '@/components/displays/SessionReviewDisplay'

import { PREVIEW_GAMES, PREVIEW_SESSION } from '../../lib/session-preview-data'
import { designSystemSquareOneBranding } from '../../lib/squareone-mock-branding'

/**
 * Design-system preview: session summary after END SESSION (`/session-review/[id]`).
 * Game rows are tappable — same as production navigation to `/game/[id]`.
 */
export default function SessionReviewPreviewPage() {
  const router = useRouter()
  const brandingStyles = {
    '--team-a': designSystemSquareOneBranding.primaryColor,
    '--team-b': designSystemSquareOneBranding.secondaryColor,
    '--brand-primary': designSystemSquareOneBranding.primaryColor,
  } as CSSProperties

  return (
    <div style={{ minHeight: '100vh', ...brandingStyles }}>
      <SessionReviewDisplay
        courtName={designSystemSquareOneBranding.courtName}
        session={PREVIEW_SESSION}
        games={PREVIEW_GAMES}
        loading={false}
        branding={designSystemSquareOneBranding}
        onGameClick={(gameId) =>
          router.push(`/design-system/preview/game?id=${encodeURIComponent(gameId)}`)
        }
      />
    </div>
  )
}
