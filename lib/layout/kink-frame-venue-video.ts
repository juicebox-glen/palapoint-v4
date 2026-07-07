/**
 * Venue TV background video.
 *
 * Firestick / kiosk: prefer `native` — self-hosted H.264 MP4 (hardware decode, no iframe).
 * YouTube embed is fine for dev/preview but often stutters in Silk / kiosk WebViews.
 *
 * Export your loop as 1920×1080 H.264 (~8–12 Mbps) → `public/video/venue-idle.mp4`
 * then set NEXT_PUBLIC_KINK_FRAME_VIDEO_BACKEND=native
 */

export type KinkFrameVideoBackend = 'youtube' | 'native'

const DEFAULT_NATIVE_SRC = '/video/venue-idle.mp4'

export function kinkFrameVideoBackend(): KinkFrameVideoBackend {
  const env = process.env.NEXT_PUBLIC_KINK_FRAME_VIDEO_BACKEND
  if (env === 'native' || env === 'youtube') return env
  return 'youtube'
}

export function kinkFrameNativeVideoSrc(): string {
  return process.env.NEXT_PUBLIC_KINK_FRAME_VIDEO_SRC ?? DEFAULT_NATIVE_SRC
}

export function kinkFrameUseNativeVideo(): boolean {
  return kinkFrameVideoBackend() === 'native'
}
