'use client'

import { KinkFrameSkeletonDisplay } from '@/components/layout/KinkFrameSkeletonDisplay'

/** Kink frame v2 skeleton — geometry only, mockup overlay for pixel checks. */
export default function KinkFrameSkeletonPage() {
  return (
    <>
      <KinkFrameSkeletonDisplay />
      <p className="kink-frame-demo-caption">
        Kink v2 skeleton ·{' '}
        <a href="/kink-frame/skeleton/display" className="kink-frame-demo-link">
          TV display
        </a>
        {' · '}
        <a href="/kink-frame" className="kink-frame-demo-link">
          venue demo
        </a>
      </p>
    </>
  )
}
