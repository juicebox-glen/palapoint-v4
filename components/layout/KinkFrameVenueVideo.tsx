'use client'

import { kinkFrameNativeVideoSrc, kinkFrameUseNativeVideo } from '@/lib/layout/kink-frame-venue-video'
import { kinkFrameYoutubeEmbedSrc } from '@/lib/layout/kink-frame-youtube'

export interface KinkFrameVenueVideoProps {
  className?: string
  /** Force YouTube even when native is configured (e.g. preview without MP4). */
  forceYoutube?: boolean
}

/** Full-bleed muted loop — native MP4 on TV, YouTube iframe fallback. */
export function KinkFrameVenueVideo({ className, forceYoutube = false }: KinkFrameVenueVideoProps) {
  const useNative = !forceYoutube && kinkFrameUseNativeVideo()

  if (useNative) {
    return (
      <video
        className={['kink-frame-venue-video', className].filter(Boolean).join(' ')}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden
      >
        <source src={kinkFrameNativeVideoSrc()} type="video/mp4" />
      </video>
    )
  }

  return (
    <div className={['kink-frame-youtube', className].filter(Boolean).join(' ')} aria-hidden>
      <iframe
        src={kinkFrameYoutubeEmbedSrc()}
        title="YouTube video player"
        allow="autoplay; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
