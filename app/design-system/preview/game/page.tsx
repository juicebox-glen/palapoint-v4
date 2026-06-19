'use client'

import { Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import GameDetailDisplay from '@/components/displays/GameDetailDisplay'

import { getGamePreviewData } from '../../lib/game-preview-data'
import { designSystemSquareOneBranding } from '../../lib/squareone-mock-branding'

function GamePreviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const gameId = searchParams.get('id')
  const game = useMemo(() => getGamePreviewData(gameId), [gameId])

  return (
    <GameDetailDisplay
      game={game}
      branding={designSystemSquareOneBranding}
      onBack={() => router.push('/design-system/preview/session-review')}
    />
  )
}

/** Design-system preview: match stats after tapping a game on session review (`/game/[id]`). */
export default function GamePreviewPage() {
  return (
    <Suspense fallback={<div className="ds-preview-fallback">Loading game preview…</div>}>
      <GamePreviewContent />
    </Suspense>
  )
}
