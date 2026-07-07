'use client'

import { kinkFrameModePanelKey, type KinkFrameVenueMode } from '@/lib/layout/kink-frame-venue-mode'
import {
  kinkFrameModeUsesMotionGraphic,
  kinkFrameModeUsesVideo,
} from '@/lib/layout/kink-frame-transitions'
import { kinkFrameYoutubeEmbedSrc } from '@/lib/layout/kink-frame-youtube'

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
        <div className="kink-frame-youtube">
          <iframe
            src={kinkFrameYoutubeEmbedSrc()}
            title="YouTube video player"
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
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
