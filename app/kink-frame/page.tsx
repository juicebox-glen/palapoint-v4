'use client'

import { KinkFrameVenueScreen } from '@/components/layout/KinkFrameVenueScreen'

/** Demo route for the 1920×1080 kink-frame layout — `/kink-frame` */
export default function KinkFramePage() {
  return (
    <>
      <KinkFrameVenueScreen />
      <p className="kink-frame-demo-caption">
        1920×1080 kink frame · Idle / Showcase / Social / Social · Flat ·{' '}
        <a href="/kink-frame/skeleton" className="kink-frame-demo-link">
          v2 skeleton
        </a>
      </p>
    </>
  )
}
