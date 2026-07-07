import type { KinkFrameVenueMode } from '@/lib/layout/kink-frame-venue-mode'

/** Modes that use the YouTube video layer behind the frame. */
export function kinkFrameModeUsesVideo(mode: KinkFrameVenueMode): boolean {
  return mode === 'idle'
}

/** Showcase and Social share the same motion-graphic backdrop. */
export function kinkFrameModeUsesMotionGraphic(mode: KinkFrameVenueMode): boolean {
  return mode === 'showcase' || mode === 'social' || mode === 'socialFlat'
}

/** Same left/right panels — only the display shell differs. */
export function kinkFrameModesShareContent(a: KinkFrameVenueMode, b: KinkFrameVenueMode): boolean {
  if (a === b) return true
  return (
    (a === 'social' || a === 'socialFlat') &&
    (b === 'social' || b === 'socialFlat')
  )
}

export function kinkFrameModesShareBackground(a: KinkFrameVenueMode, b: KinkFrameVenueMode): boolean {
  if (kinkFrameModeUsesVideo(a) && kinkFrameModeUsesVideo(b)) return true
  if (kinkFrameModeUsesMotionGraphic(a) && kinkFrameModeUsesMotionGraphic(b)) return true
  return a === b
}

export function kinkFrameModeBackgroundClass(mode: KinkFrameVenueMode): string {
  if (kinkFrameModeUsesMotionGraphic(mode)) return 'kink-frame-backdrop--social'
  if (kinkFrameModeUsesVideo(mode)) return 'kink-frame-backdrop--video'
  return `kink-frame-backdrop--${mode}`
}

/** Broadcast timing — keep panel + background in sync. */
export const KINK_FRAME_GLASS_MS = 480
export const KINK_FRAME_CARD_ANIM_MS = 920
export const KINK_FRAME_CARD_STAGGER_MS = 395
export const KINK_FRAME_BG_CROSSFADE_MS = 720

export const KINK_FRAME_CONTENT_EXIT_MS =
  KINK_FRAME_GLASS_MS + KINK_FRAME_CARD_STAGGER_MS + KINK_FRAME_CARD_ANIM_MS

export const KINK_FRAME_CONTENT_ENTER_MS = KINK_FRAME_CARD_ANIM_MS + KINK_FRAME_CARD_STAGGER_MS

/** Background starts crossfading before content exit finishes (overlap). */
export const KINK_FRAME_BG_CROSSFADE_LEAD_MS = 280

export const KINK_FRAME_MODE_ENTER_MS = KINK_FRAME_CONTENT_ENTER_MS + KINK_FRAME_GLASS_MS
