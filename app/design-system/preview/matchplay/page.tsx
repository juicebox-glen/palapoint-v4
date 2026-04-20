'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import MatchplayPreviewStates from './MatchplayPreviewStates'

function MatchplayPreviewContent() {
  const searchParams = useSearchParams()
  const state = searchParams.get('state') || 'launcher'
  return <MatchplayPreviewStates state={state} />
}

export default function MatchplayPreviewPage() {
  return (
    <Suspense fallback={<div className="ds-preview-fallback">Loading matchplay preview…</div>}>
      <MatchplayPreviewContent />
    </Suspense>
  )
}
