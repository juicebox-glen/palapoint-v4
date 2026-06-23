'use client'

import { useRouter } from 'next/navigation'

import SessionReviewDisplay from '@/components/displays/SessionReviewDisplay'
import { brandingStylesFor } from '@/lib/venue'

import { PREVIEW_GAMES, PREVIEW_SESSION } from '../../lib/session-preview-data'
import { designSystemSquareOneBranding } from '../../lib/squareone-mock-branding'

/**
 * Design-system preview: session summary after END SESSION (`/session-review/[id]`).
 * Game row navigation is gated by SESSION_REVIEW_GAME_NAV_ENABLED in SessionReviewDisplay.
 */
export default function SessionReviewPreviewPage() {
  const router = useRouter()
  const brandingStyles = brandingStylesFor(designSystemSquareOneBranding)

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
