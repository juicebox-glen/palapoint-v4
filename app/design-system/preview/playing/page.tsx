'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function PlayingPreviewContent() {
  const searchParams = useSearchParams()
  const state = searchParams.get('state') || 'default'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p style={{ color: 'var(--text-muted)' }}>Player Playing — {state}</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '280px' }}>
        Preview not yet implemented. Use the playing route for full UI testing.
      </p>
    </div>
  )
}

export default function PlayingPreviewPage() {
  return (
    <Suspense fallback={<div className="ds-preview-fallback">Loading…</div>}>
      <PlayingPreviewContent />
    </Suspense>
  )
}
