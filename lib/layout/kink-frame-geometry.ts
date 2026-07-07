/**
 * Kink-frame layout geometry for a fixed 1920×1080 TV stage (16:9).
 * Coordinates use viewBox `0 0 1920 1080`.
 *
 * The bottom-right "kink" steps the content edge upward so the frame is
 * thicker on the lower-right — matched between media mask and frame overlay.
 */

export const KINK_FRAME_VIEWBOX = { width: 1920, height: 1080 } as const

/** Inner content boundary — media is masked/clipped to this shape. */
export const KINK_FRAME_CONTENT_PATH = [
  'M 66 48',
  'H 1854',
  'A 25 30 0 0 1 1880 78',
  'V 932',
  'A 25 30 0 0 1 1854 962',
  'H 1640',
  'C 1620 962 1620 1002 1600 1002',
  'H 66',
  'A 25 30 0 0 1 40 1002',
  'V 78',
  'A 25 30 0 0 1 66 48',
  'Z',
].join(' ')

/** Outer rounded rect minus inner hole — frame overlay on top of content. */
export const KINK_FRAME_OVERLAY_PATH = [
  'M 0 54',
  'A 45 54 0 0 1 45 0',
  'H 1875',
  'A 45 54 0 0 1 1920 54',
  'V 1026',
  'A 45 54 0 0 1 1875 1080',
  'H 45',
  'A 45 54 0 0 1 0 1026',
  'Z',
  KINK_FRAME_CONTENT_PATH,
].join(' ')

export const KINK_FRAME_COLORS = {
  frame: '#0e1117',
  contentPlaceholder: '#5882c4',
  matte: '#3d4144',
} as const

/** Bottom-right frame pocket below the content step (viewBox px). */
export const KINK_FRAME_NOTCH = {
  top: 962,
  bottom: 1080,
  left: 1600,
  right: 1920,
  outerInsetX: 45,
  outerInsetBottom: 45,
} as const

/** Clock widget height at 1920×1080 design px (icon/body padding + time). */
export const KINK_FRAME_CLOCK_DESIGN_HEIGHT = 76

/** Vertical inset to centre the clock in the notch pocket. */
export const KINK_FRAME_CLOCK_BOTTOM_INSET =
  (KINK_FRAME_NOTCH.bottom - KINK_FRAME_NOTCH.top - KINK_FRAME_CLOCK_DESIGN_HEIGHT) / 2

/** CSS mask-image data URI — white fill reveals media inside the inner shape. */
export function kinkFrameContentMaskUrl(): string {
  const { width, height } = KINK_FRAME_VIEWBOX
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
    `<path fill="#fff" d="${KINK_FRAME_CONTENT_PATH}"/>`,
    '</svg>',
  ].join('')
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
