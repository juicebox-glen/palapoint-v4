'use client'

import { KinkFrameVenueVideo } from '@/components/layout/KinkFrameVenueVideo'
import { kinkFrameModePanelKey, type KinkFrameVenueMode } from '@/lib/layout/kink-frame-venue-mode'
import {
  kinkFrameModeUsesMotionGraphic,
  kinkFrameModeUsesVideo,
} from '@/lib/layout/kink-frame-transitions'

export interface KinkFrameMediaBackdropsProps {
  mode: KinkFrameVenueMode
  transitioning?: boolean
}

/** Layered full-bleed backgrounds — video for idle, motion graphic for showcase/social. */
export function KinkFrameMediaBackdrops({ mode, transitioning = false }: KinkFrameMediaBackdropsProps) {
  const showVideo = kinkFrameModeUsesVideo(mode)
  const showMotionGraphic = kinkFrameModeUsesMotionGraphic(mode)

  return (
    <div
      className={[
        'kink-frame-backdrops',
        transitioning ? 'kink-frame-backdrops--transitioning' : '',
        `kink-frame-backdrops--${kinkFrameModePanelKey(mode)}`,
      ].join(' ')}
    >
      <div className="kink-frame-backdrop kink-frame-backdrop--base" aria-hidden />

      <div
        className={[
          'kink-frame-backdrop',
          'kink-frame-backdrop--video',
          showVideo ? 'kink-frame-backdrop--active' : '',
        ].join(' ')}
        aria-hidden={!showVideo}
      >
        <KinkFrameVenueVideo />
      </div>

      <div
        className={[
          'kink-frame-backdrop',
          'kink-frame-backdrop--social',
          showMotionGraphic ? 'kink-frame-backdrop--active' : '',
        ].join(' ')}
        aria-hidden={!showMotionGraphic}
      />
    </div>
  )
}
