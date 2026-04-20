import { Suspense } from 'react'

import { PlayerMobileHub } from './PlayerMobileHub'

export default function PlayerMobileScreensPage() {
  return (
    <Suspense
      fallback={
        <div className="ds-page ds-page--wide">
          <p className="ds-preview-fallback" style={{ minHeight: '40vh' }}>
            Loading…
          </p>
        </div>
      }
    >
      <PlayerMobileHub />
    </Suspense>
  )
}
